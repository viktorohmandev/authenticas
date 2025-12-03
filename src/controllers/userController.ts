import { Request, Response } from 'express';
import { 
  User, 
  Company,
  CreateUserRequest, 
  UpdateUserRequest,
  ApiResponse 
} from '../models/types';
import { 
  readJsonFile, 
  findById, 
  findBy,
  appendToJsonFile,
  updateInJsonFile,
  deleteFromJsonFile,
  findAllBy
} from '../utils/fileUtils';
import { generateId } from '../utils/apiKeyUtils';
import { getCurrentTimestamp, isNewMonth } from '../utils/dateUtils';
import { hashPassword } from '../utils/authUtils';
import { audit } from '../services/auditService';
import { getActiveLinksForRetailer } from './linkController';

const USERS_FILE = 'users.json';
const COMPANIES_FILE = 'companies.json';

// Sanitize user for response (hide password)
function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

// Check and reset monthly spending if needed
async function checkAndResetMonthlySpending(user: User): Promise<User> {
  if (isNewMonth(user.lastResetDate)) {
    const previousSpent = user.spentThisMonth;
    const now = getCurrentTimestamp();
    
    await updateInJsonFile<User>(USERS_FILE, user.id, {
      spentThisMonth: 0,
      lastResetDate: now
    });
    
    // Audit the monthly reset
    await audit.monthlyReset(user.id, previousSpent);
    
    return {
      ...user,
      spentThisMonth: 0,
      lastResetDate: now
    };
  }
  return user;
}

// Get current user's own data
export async function getCurrentUserData(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authenticated'
      };
      res.status(401).json(response);
      return;
    }
    
    let user = await findById<User>(USERS_FILE, req.user.userId);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Check and reset monthly spending
    user = await checkAndResetMonthlySpending(user);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(user)
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user data'
    };
    res.status(500).json(response);
  }
}

// Get all users (filtered by role using link table)
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    let users = await readJsonFile<User>(USERS_FILE);
    
    // Filter based on user role
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      // Retailer admin sees users from companies linked to their retailer (via link table)
      const links = await getActiveLinksForRetailer(req.user.retailerId);
      const linkedCompanyIds = new Set(links.map(l => l.companyId));
      users = users.filter(u => u.companyId && linkedCompanyIds.has(u.companyId));
    } else if (req.user?.role === 'company_admin') {
      // Company admin sees only their own company's users
      users = users.filter(u => u.companyId === req.user!.companyId);
    }
    // system_admin sees all
    
    // Check and reset monthly spending for all users
    users = await Promise.all(users.map(checkAndResetMonthlySpending));
    
    const sanitized = users.map(sanitizeUser);
    
    const response: ApiResponse<typeof sanitized> = {
      success: true,
      data: sanitized
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch users'
    };
    res.status(500).json(response);
  }
}

// Get user by ID
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    let user = await findById<User>(USERS_FILE, id);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Additional access checks
    if (req.user?.role === 'company_admin' && user.companyId !== req.user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. User does not belong to your company.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (req.user?.role === 'company_user' && user.id !== req.user.userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only view your own data.'
      };
      res.status(403).json(response);
      return;
    }
    
    // Check and reset monthly spending
    user = await checkAndResetMonthlySpending(user);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(user)
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user'
    };
    res.status(500).json(response);
  }
}

// Create new user
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      companyId,
      retailerId,
      role = 'company_user', 
      spendingLimit = 1000 
    } = req.body as CreateUserRequest;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      const response: ApiResponse = {
        success: false,
        error: 'Email, password, firstName, and lastName are required'
      };
      res.status(400).json(response);
      return;
    }
    
    // Validate role assignment permissions
    if (req.user?.role === 'company_admin') {
      // Company admin can only create company_user or company_admin for their own company
      if (!['company_user', 'company_admin'].includes(role)) {
        const response: ApiResponse = {
          success: false,
          error: 'Company admins can only create company_user or company_admin roles'
        };
        res.status(403).json(response);
        return;
      }
      
      // Must create for their own company
      if (companyId !== req.user.companyId) {
        const response: ApiResponse = {
          success: false,
          error: 'You can only create users for your own company'
        };
        res.status(403).json(response);
        return;
      }
    }
    
    // Validate company/retailer based on role
    if (['company_admin', 'company_user'].includes(role) && !companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Company ID is required for company roles'
      };
      res.status(400).json(response);
      return;
    }
    
    if (role === 'retailer_admin' && !retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer ID is required for retailer_admin role'
      };
      res.status(400).json(response);
      return;
    }
    
    // Check if email already exists
    const existingUser = await findBy<User>(USERS_FILE, u => u.email === email.toLowerCase());
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User with this email already exists'
      };
      res.status(400).json(response);
      return;
    }
    
    // Check if company exists (if companyId provided)
    if (companyId) {
      const company = await findById<Company>(COMPANIES_FILE, companyId);
      if (!company) {
        const response: ApiResponse = {
          success: false,
          error: 'Company not found'
        };
        res.status(404).json(response);
        return;
      }
    }
    
    const now = getCurrentTimestamp();
    const hashedPassword = await hashPassword(password);
    
    const newUser: User = {
      id: generateId(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyId,
      retailerId,
      role,
      spendingLimit,
      spentThisMonth: 0,
      lastResetDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    await appendToJsonFile(USERS_FILE, newUser);
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.userCreated(performedBy, newUser.id, { 
      email: newUser.email, 
      companyId,
      retailerId,
      role 
    });
    if (companyId) {
      await audit.userAddedToCompany(performedBy, newUser.id, companyId);
    }
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(newUser),
      message: 'User created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create user error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create user'
    };
    res.status(500).json(response);
  }
}

// Update user
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateUserRequest;
    
    const existingUser = await findById<User>(USERS_FILE, id);
    
    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Company admin can only update users in their company
    if (req.user?.role === 'company_admin' && existingUser.companyId !== req.user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. User does not belong to your company.'
      };
      res.status(403).json(response);
      return;
    }
    
    // Validate: spending limit cannot be set below current monthly spending
    if (updates.spendingLimit !== undefined && updates.spendingLimit < existingUser.spentThisMonth) {
      const response: ApiResponse = {
        success: false,
        error: "Cannot set limit below the user's current monthly spending."
      };
      res.status(400).json(response);
      return;
    }
    
    const beforeState = { 
      email: existingUser.email, 
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
      spendingLimit: existingUser.spendingLimit,
      isActive: existingUser.isActive 
    };
    
    // Track specific changes for audit
    const performedBy = req.user?.userId || 'system';
    
    if (updates.role && updates.role !== existingUser.role) {
      await audit.userRoleChanged(performedBy, id, existingUser.role, updates.role);
    }
    
    if (updates.spendingLimit !== undefined && updates.spendingLimit !== existingUser.spendingLimit) {
      await audit.userLimitChanged(performedBy, id, existingUser.spendingLimit, updates.spendingLimit);
    }
    
    const updatedUser = await updateInJsonFile<User>(USERS_FILE, id, {
      ...updates,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update user'
      };
      res.status(500).json(response);
      return;
    }
    
    const afterState = { 
      email: updatedUser.email, 
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      spendingLimit: updatedUser.spendingLimit,
      isActive: updatedUser.isActive 
    };
    
    await audit.userUpdated(performedBy, id, beforeState, afterState);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(updatedUser),
      message: 'User updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update user'
    };
    res.status(500).json(response);
  }
}

// Delete user
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const existingUser = await findById<User>(USERS_FILE, id);
    
    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Company admin can only delete users in their company
    if (req.user?.role === 'company_admin' && existingUser.companyId !== req.user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. User does not belong to your company.'
      };
      res.status(403).json(response);
      return;
    }
    
    const deleted = await deleteFromJsonFile<User>(USERS_FILE, id);
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete user'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.userDeleted(performedBy, id, { email: existingUser.email });
    if (existingUser.companyId) {
      await audit.userRemovedFromCompany(performedBy, id, existingUser.companyId);
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete user'
    };
    res.status(500).json(response);
  }
}

// Set user spending limit
export async function setSpendingLimit(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { spendingLimit } = req.body;
    
    if (typeof spendingLimit !== 'number' || spendingLimit < 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Valid spending limit is required (must be a non-negative number)'
      };
      res.status(400).json(response);
      return;
    }
    
    const existingUser = await findById<User>(USERS_FILE, id);
    
    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Company admin can only set limits for users in their company
    if (req.user?.role === 'company_admin' && existingUser.companyId !== req.user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. User does not belong to your company.'
      };
      res.status(403).json(response);
      return;
    }
    
    // Validate: limit cannot be set below current monthly spending
    if (spendingLimit < existingUser.spentThisMonth) {
      const response: ApiResponse = {
        success: false,
        error: "Cannot set limit below the user's current monthly spending."
      };
      res.status(400).json(response);
      return;
    }
    
    const oldLimit = existingUser.spendingLimit;
    
    const updatedUser = await updateInJsonFile<User>(USERS_FILE, id, {
      spendingLimit,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update spending limit'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.userLimitChanged(performedBy, id, oldLimit, spendingLimit);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(updatedUser),
      message: `Spending limit updated from $${oldLimit} to $${spendingLimit}`
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update spending limit'
    };
    res.status(500).json(response);
  }
}

// Add user to company
export async function addUserToCompany(req: Request, res: Response): Promise<void> {
  try {
    const { userId, companyId } = req.params;
    
    const user = await findById<User>(USERS_FILE, userId);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const company = await findById<Company>(COMPANIES_FILE, companyId);
    if (!company) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const oldCompanyId = user.companyId;
    
    const updatedUser = await updateInJsonFile<User>(USERS_FILE, userId, {
      companyId,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to add user to company'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    if (oldCompanyId && oldCompanyId !== companyId) {
      await audit.userRemovedFromCompany(performedBy, userId, oldCompanyId);
    }
    await audit.userAddedToCompany(performedBy, userId, companyId);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(updatedUser),
      message: `User added to company ${company.name}`
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to add user to company'
    };
    res.status(500).json(response);
  }
}

// Remove user from company (deactivate)
export async function removeUserFromCompany(req: Request, res: Response): Promise<void> {
  try {
    const { userId, companyId } = req.params;
    
    const user = await findById<User>(USERS_FILE, userId);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    if (user.companyId !== companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'User is not part of this company'
      };
      res.status(400).json(response);
      return;
    }
    
    const updatedUser = await updateInJsonFile<User>(USERS_FILE, userId, {
      isActive: false,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to remove user from company'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.userRemovedFromCompany(performedBy, userId, companyId);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeUser(updatedUser),
      message: 'User removed from company (deactivated)'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to remove user from company'
    };
    res.status(500).json(response);
  }
}
