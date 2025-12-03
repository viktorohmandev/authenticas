import { Request, Response } from 'express';
import { User, LoginCredentials, ApiResponse } from '../models/types';
import { findBy } from '../utils/fileUtils';
import { comparePassword, generateToken } from '../utils/authUtils';
import { audit } from '../services/auditService';

const USERS_FILE = 'users.json';

// Login endpoint
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginCredentials;
    
    // Validate input
    if (!email || !password) {
      const response: ApiResponse = {
        success: false,
        error: 'Email and password are required'
      };
      res.status(400).json(response);
      return;
    }
    
    // Find user by email
    const user = await findBy<User>(USERS_FILE, u => u.email === email.toLowerCase());
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password'
      };
      res.status(401).json(response);
      return;
    }
    
    // Check if user is active
    if (!user.isActive) {
      const response: ApiResponse = {
        success: false,
        error: 'Account is deactivated. Please contact your administrator.'
      };
      res.status(403).json(response);
      return;
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password'
      };
      res.status(401).json(response);
      return;
    }
    
    // Generate JWT token with role and all relevant IDs
    const token = generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      retailerId: user.retailerId,
      role: user.role
    });
    
    // Audit login
    await audit.userLogin(user.id);
    
    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          retailerId: user.retailerId,
          role: user.role,
          spendingLimit: user.spendingLimit,
          spentThisMonth: user.spentThisMonth
        }
      },
      message: 'Login successful'
    };
    res.json(response);
    
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed'
    };
    res.status(500).json(response);
  }
}

// Get current user info (requires JWT auth)
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authenticated'
      };
      res.status(401).json(response);
      return;
    }
    
    const user = await findBy<User>(USERS_FILE, u => u.id === req.user!.userId);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        retailerId: user.retailerId,
        role: user.role,
        spendingLimit: user.spendingLimit,
        spentThisMonth: user.spentThisMonth
      }
    };
    res.json(response);
    
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get user info'
    };
    res.status(500).json(response);
  }
}

// Refresh token endpoint
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authenticated'
      };
      res.status(401).json(response);
      return;
    }
    
    const user = await findBy<User>(USERS_FILE, u => u.id === req.user!.userId);
    
    if (!user || !user.isActive) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found or inactive'
      };
      res.status(401).json(response);
      return;
    }
    
    // Generate new token with current role and IDs
    const token = generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      retailerId: user.retailerId,
      role: user.role
    });
    
    const response: ApiResponse = {
      success: true,
      data: { token },
      message: 'Token refreshed successfully'
    };
    res.json(response);
    
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to refresh token'
    };
    res.status(500).json(response);
  }
}
