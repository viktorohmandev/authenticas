import { Request, Response } from 'express';
import { 
  Transaction, 
  User, 
  Company,
  Retailer,
  CompanyRetailerLink,
  VerifyPurchaseRequest,
  ApiResponse,
  DenialReason
} from '../models/types';
import { 
  readJsonFile, 
  findById, 
  appendToJsonFile,
  updateInJsonFile,
  findAllBy
} from '../utils/fileUtils';
import { generateId } from '../utils/apiKeyUtils';
import { getCurrentTimestamp, isNewMonth, isCurrentMonth } from '../utils/dateUtils';
import { triggerWebhook } from '../services/webhookService';
import { audit } from '../services/auditService';
import { isLinked, getActiveLinksForRetailer } from './linkController';

const TRANSACTIONS_FILE = 'transactions.json';
const USERS_FILE = 'users.json';
const COMPANIES_FILE = 'companies.json';
const RETAILERS_FILE = 'retailers.json';
const LINKS_FILE = 'company_retailer_links.json';

// Compute GLOBAL user spending across ALL retailers for current month
async function computeGlobalMonthlySpending(userId: string): Promise<number> {
  const transactions = await readJsonFile<Transaction>(TRANSACTIONS_FILE);
  
  // Sum all approved transactions for this user in current month
  const monthlySpending = transactions
    .filter(t => 
      t.userId === userId && 
      t.status === 'approved' && 
      isCurrentMonth(t.timestamp)
    )
    .reduce((sum, t) => sum + t.amount, 0);
  
  return monthlySpending;
}

// Check and reset monthly spending if needed
async function checkAndResetMonthlySpending(user: User): Promise<User> {
  if (isNewMonth(user.lastResetDate)) {
    const previousSpent = user.spentThisMonth;
    const now = getCurrentTimestamp();
    
    const updatedUser = await updateInJsonFile<User>(USERS_FILE, user.id, {
      spentThisMonth: 0,
      lastResetDate: now
    });
    
    // Audit the monthly reset
    await audit.monthlyReset(user.id, previousSpent);
    
    return updatedUser || { ...user, spentThisMonth: 0, lastResetDate: now };
  }
  return user;
}

// Verify purchase endpoint - Multi-retailer version
export async function verifyPurchase(req: Request, res: Response): Promise<void> {
  try {
    const { userId, companyId, retailerId, amount } = req.body as VerifyPurchaseRequest;
    
    // Validate input
    if (!userId || !companyId || !retailerId || typeof amount !== 'number') {
      const response: ApiResponse = {
        success: false,
        error: 'userId, companyId, retailerId, and amount are required'
      };
      res.status(400).json(response);
      return;
    }
    
    if (amount <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Amount must be greater than 0'
      };
      res.status(400).json(response);
      return;
    }
    
    // Find retailer
    const retailer = await findById<Retailer>(RETAILERS_FILE, retailerId);
    if (!retailer) {
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'retailer_not_found', 0
      );
      
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'retailer_not_found'
        }
      };
      res.status(404).json(response);
      return;
    }
    
    // Find company
    const company = await findById<Company>(COMPANIES_FILE, companyId);
    if (!company) {
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'company_not_found', 0
      );
      
      const response: ApiResponse = {
        success: false,
        error: 'Company not found',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'company_not_found'
        }
      };
      res.status(404).json(response);
      return;
    }
    
    // Check if company is linked to this retailer (MULTI-RETAILER CHECK)
    const linked = await isLinked(companyId, retailerId);
    if (!linked) {
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'not_linked', 0
      );
      
      const response: ApiResponse = {
        success: false,
        error: 'Company is not connected to this retailer',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'not_linked'
        }
      };
      res.status(403).json(response);
      return;
    }
    
    // Check company status
    if (!company.isActive) {
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'company_inactive', 0
      );
      
      // Trigger webhook to retailer
      triggerWebhookToRetailer(retailer, 'purchase.denied', transaction);
      
      const response: ApiResponse = {
        success: false,
        error: 'Company is inactive',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'company_inactive'
        }
      };
      res.status(403).json(response);
      return;
    }
    
    // Find user
    let user = await findById<User>(USERS_FILE, userId);
    if (!user) {
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'user_not_found', 0
      );
      
      triggerWebhookToRetailer(retailer, 'purchase.denied', transaction);
      
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'user_not_found'
        }
      };
      res.status(404).json(response);
      return;
    }
    
    // Check user belongs to company
    if (user.companyId !== companyId) {
      const globalSpent = await computeGlobalMonthlySpending(userId);
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'insufficient_permissions', globalSpent
      );
      
      triggerWebhookToRetailer(retailer, 'purchase.denied', transaction, {
        spentThisMonth: globalSpent,
        spendingLimit: user.spendingLimit
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'User does not belong to this company',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'insufficient_permissions'
        }
      };
      res.status(403).json(response);
      return;
    }
    
    // Check user status
    if (!user.isActive) {
      const globalSpent = await computeGlobalMonthlySpending(userId);
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'user_inactive', globalSpent
      );
      
      triggerWebhookToRetailer(retailer, 'purchase.denied', transaction, {
        spentThisMonth: globalSpent,
        spendingLimit: user.spendingLimit
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'User is inactive',
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'user_inactive'
        }
      };
      res.status(403).json(response);
      return;
    }
    
    // Check and reset monthly spending
    user = await checkAndResetMonthlySpending(user);
    
    // Compute GLOBAL spending across ALL retailers
    const globalSpentThisMonth = await computeGlobalMonthlySpending(userId);
    
    // Check spending limit using GLOBAL spending
    const newGlobalSpentAmount = globalSpentThisMonth + amount;
    if (newGlobalSpentAmount > user.spendingLimit) {
      const transaction = await createDeniedTransaction(
        userId, companyId, retailerId, amount, 'limit_exceeded', globalSpentThisMonth
      );
      
      // Trigger both denied and limit exceeded webhooks
      triggerWebhookToRetailer(retailer, 'purchase.denied', transaction, {
        spentThisMonth: globalSpentThisMonth,
        spendingLimit: user.spendingLimit
      });
      triggerWebhookToRetailer(retailer, 'limit.exceeded', transaction, {
        spentThisMonth: globalSpentThisMonth,
        spendingLimit: user.spendingLimit
      });
      
      // Audit
      await audit.purchaseDenied(userId, transaction.id, amount, 'limit_exceeded');
      
      const response: ApiResponse = {
        success: false,
        error: `Purchase would exceed spending limit. Current: $${globalSpentThisMonth.toFixed(2)}, Limit: $${user.spendingLimit.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
        data: {
          transactionId: transaction.id,
          status: 'denied',
          reason: 'limit_exceeded',
          spentThisMonth: globalSpentThisMonth,
          spendingLimit: user.spendingLimit,
          remainingBudget: user.spendingLimit - globalSpentThisMonth
        }
      };
      res.status(403).json(response);
      return;
    }
    
    // Approve purchase
    const balanceBefore = globalSpentThisMonth;
    const balanceAfter = newGlobalSpentAmount;
    
    const transaction = await createApprovedTransaction(
      userId, companyId, retailerId, amount, balanceBefore, balanceAfter
    );
    
    // Update user's global spent amount
    await updateInJsonFile<User>(USERS_FILE, userId, {
      spentThisMonth: newGlobalSpentAmount,
      updatedAt: getCurrentTimestamp()
    });
    
    // Trigger approved webhook to retailer
    triggerWebhookToRetailer(retailer, 'purchase.approved', transaction, {
      spentThisMonth: newGlobalSpentAmount,
      spendingLimit: user.spendingLimit
    });
    
    // Audit
    await audit.purchaseApproved(userId, transaction.id, amount, balanceBefore, balanceAfter);
    
    const response: ApiResponse = {
      success: true,
      message: 'Purchase approved',
      data: {
        transactionId: transaction.id,
        status: 'approved',
        amount,
        spentThisMonth: newGlobalSpentAmount,
        spendingLimit: user.spendingLimit,
        remainingBudget: user.spendingLimit - newGlobalSpentAmount
      }
    };
    res.json(response);
    
  } catch (error) {
    console.error('Verify purchase error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to verify purchase'
    };
    res.status(500).json(response);
  }
}

// Helper to trigger webhook to retailer
function triggerWebhookToRetailer(
  retailer: Retailer, 
  event: 'purchase.approved' | 'purchase.denied' | 'limit.exceeded',
  transaction: Transaction,
  extra?: { spentThisMonth?: number; spendingLimit?: number }
): void {
  if (retailer.webhookUrl) {
    // Create a pseudo-company object for the webhook service
    const webhookTarget = {
      webhookUrl: retailer.webhookUrl,
      id: retailer.id,
      name: retailer.name
    };
    triggerWebhook(webhookTarget as any, event, transaction, extra);
  }
}

// Create approved transaction with retailerId
async function createApprovedTransaction(
  userId: string,
  companyId: string,
  retailerId: string,
  amount: number,
  balanceBefore: number,
  balanceAfter: number
): Promise<Transaction> {
  const transaction: Transaction = {
    id: generateId(),
    userId,
    companyId,
    retailerId,
    amount,
    status: 'approved',
    timestamp: getCurrentTimestamp(),
    balanceBefore,
    balanceAfter
  };
  
  await appendToJsonFile(TRANSACTIONS_FILE, transaction);
  return transaction;
}

// Create denied transaction with retailerId
async function createDeniedTransaction(
  userId: string,
  companyId: string,
  retailerId: string,
  amount: number,
  denialReason: DenialReason,
  currentBalance: number
): Promise<Transaction> {
  const transaction: Transaction = {
    id: generateId(),
    userId,
    companyId,
    retailerId,
    amount,
    status: 'denied',
    denialReason,
    timestamp: getCurrentTimestamp(),
    balanceBefore: currentBalance,
    balanceAfter: currentBalance
  };
  
  await appendToJsonFile(TRANSACTIONS_FILE, transaction);
  return transaction;
}

// Get all transactions (filtered by role using link table)
export async function getAllTransactions(req: Request, res: Response): Promise<void> {
  try {
    let transactions = await readJsonFile<Transaction>(TRANSACTIONS_FILE);
    
    // Filter based on user role
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      // Retailer admin sees only transactions for their retailer
      transactions = transactions.filter(t => t.retailerId === req.user!.retailerId);
    } else if (req.user?.role === 'company_admin' || req.user?.role === 'company_user') {
      // Company roles see only their company's transactions (across all retailers)
      transactions = transactions.filter(t => t.companyId === req.user!.companyId);
    }
    // system_admin sees all
    
    // Sort by timestamp descending
    const sorted = transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const response: ApiResponse<Transaction[]> = {
      success: true,
      data: sorted
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch transactions'
    };
    res.status(500).json(response);
  }
}

// Get transaction by ID (with access control)
export async function getTransactionById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const transaction = await findById<Transaction>(TRANSACTIONS_FILE, id);
    
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Access control
    if (req.user?.role === 'company_admin' && transaction.companyId !== req.user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. Transaction does not belong to your company.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (req.user?.role === 'company_user' && transaction.userId !== req.user.userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only view your own transactions.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (req.user?.role === 'retailer_admin' && transaction.retailerId !== req.user.retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. Transaction does not belong to your retailer.'
      };
      res.status(403).json(response);
      return;
    }
    
    const response: ApiResponse<Transaction> = {
      success: true,
      data: transaction
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch transaction'
    };
    res.status(500).json(response);
  }
}

// Get transactions by user
export async function getTransactionsByUser(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    let transactions = await readJsonFile<Transaction>(TRANSACTIONS_FILE);
    
    // Filter by user
    transactions = transactions.filter(t => t.userId === userId);
    
    // Additional filtering for retailer_admin
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      transactions = transactions.filter(t => t.retailerId === req.user!.retailerId);
    }
    
    const sorted = transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const response: ApiResponse<Transaction[]> = {
      success: true,
      data: sorted
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user transactions'
    };
    res.status(500).json(response);
  }
}

// Get transactions by company (with access control)
export async function getTransactionsByCompany(req: Request, res: Response): Promise<void> {
  try {
    const { companyId } = req.params;
    
    // Access control for company roles
    if ((req.user?.role === 'company_admin' || req.user?.role === 'company_user') && 
        companyId !== req.user.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only view your own company transactions.'
      };
      res.status(403).json(response);
      return;
    }
    
    // For retailer_admin, check if company is linked
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      const linked = await isLinked(companyId, req.user.retailerId);
      if (!linked) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied. Company is not connected to your retailer.'
        };
        res.status(403).json(response);
        return;
      }
    }
    
    let transactions = await readJsonFile<Transaction>(TRANSACTIONS_FILE);
    
    // Filter by company
    transactions = transactions.filter(t => t.companyId === companyId);
    
    // For retailer_admin, also filter by their retailer
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      transactions = transactions.filter(t => t.retailerId === req.user!.retailerId);
    }
    
    const sorted = transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const response: ApiResponse<Transaction[]> = {
      success: true,
      data: sorted
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch company transactions'
    };
    res.status(500).json(response);
  }
}
