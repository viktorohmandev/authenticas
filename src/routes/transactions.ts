import { Router } from 'express';
import {
  verifyPurchase,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUser,
  getTransactionsByCompany
} from '../controllers/transactionController';
import { authenticateJWT, authenticateAny, requireRole, requireSelfOrAdmin } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route POST /api/transactions/verify
 * @desc Verify a purchase request
 * @access Private (API Key or JWT)
 * @body { userId, companyId, amount }
 */
router.post('/verify', authenticateAny, verifyPurchase);

/**
 * @route GET /api/transactions
 * @desc Get all transactions (filtered by role)
 * @access Private (system_admin: all, retailer_admin: their retailer's transactions, company_admin: their company's transactions)
 */
router.get('/', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin'), getAllTransactions);

/**
 * @route GET /api/transactions/:id
 * @desc Get transaction by ID
 * @access Private
 */
router.get('/:id', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin', 'company_user'), getTransactionById);

/**
 * @route GET /api/transactions/user/:userId
 * @desc Get all transactions for a user
 * @access Private (with self-or-admin check)
 */
router.get('/user/:userId', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin', 'company_user'), requireSelfOrAdmin, getTransactionsByUser);

/**
 * @route GET /api/transactions/company/:companyId
 * @desc Get all transactions for a company
 * @access Private
 */
router.get('/company/:companyId', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin'), getTransactionsByCompany);

export default router;
