import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  setSpendingLimit,
  addUserToCompany,
  removeUserFromCompany,
  getCurrentUserData
} from '../controllers/userController';
import { authenticateJWT, requireRole, requireCompanyScope, requireSelfOrAdmin } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/users
 * @desc Get all users (filtered by role)
 * @access Private (system_admin: all, retailer_admin: their retailer's users, company_admin: their company's users)
 */
router.get('/', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin'), getAllUsers);

/**
 * @route GET /api/users/me
 * @desc Get current user's data
 * @access Private (all authenticated users)
 */
router.get('/me', authenticateJWT, getCurrentUserData);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (with self-or-admin check)
 */
router.get('/:id', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin', 'company_user'), requireSelfOrAdmin, getUserById);

/**
 * @route POST /api/users
 * @desc Create new user
 * @access Private (system_admin, company_admin for their company)
 */
router.post('/', authenticateJWT, requireRole('system_admin', 'company_admin'), createUser);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private (system_admin, company_admin for their company's users)
 */
router.put('/:id', authenticateJWT, requireRole('system_admin', 'company_admin'), updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private (system_admin, company_admin for their company's users)
 */
router.delete('/:id', authenticateJWT, requireRole('system_admin', 'company_admin'), deleteUser);

/**
 * @route PUT /api/users/:id/spending-limit
 * @desc Set user spending limit
 * @access Private (system_admin, company_admin for their company's users)
 */
router.put('/:id/spending-limit', authenticateJWT, requireRole('system_admin', 'company_admin'), setSpendingLimit);

/**
 * @route POST /api/users/:userId/company/:companyId
 * @desc Add user to company
 * @access Private (system_admin only)
 */
router.post('/:userId/company/:companyId', authenticateJWT, requireRole('system_admin'), addUserToCompany);

/**
 * @route DELETE /api/users/:userId/company/:companyId
 * @desc Remove user from company
 * @access Private (system_admin only)
 */
router.delete('/:userId/company/:companyId', authenticateJWT, requireRole('system_admin'), removeUserFromCompany);

export default router;
