import { Router } from 'express';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  regenerateApiKey,
  registerWebhook,
  getCompanyUsers
} from '../controllers/companyController';
import { createDisconnectRequest, getDisconnectRequestsForCompany } from '../controllers/disconnectRequestController';
import { authenticateJWT, requireRole, requireCompanyScope } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/companies
 * @desc Get all companies (filtered by role)
 * @access Private (system_admin: all, retailer_admin: their retailer's companies, company_admin/user: their company)
 */
router.get('/', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin', 'company_user'), getAllCompanies);

/**
 * @route GET /api/companies/:id
 * @desc Get company by ID
 * @access Private (with scoping)
 */
router.get('/:id', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin', 'company_user'), requireCompanyScope, getCompanyById);

/**
 * @route POST /api/companies
 * @desc Create new company
 * @access Private (system_admin only)
 */
router.post('/', authenticateJWT, requireRole('system_admin'), createCompany);

/**
 * @route PUT /api/companies/:id
 * @desc Update company
 * @access Private (system_admin, company_admin of that company)
 */
router.put('/:id', authenticateJWT, requireRole('system_admin', 'company_admin'), requireCompanyScope, updateCompany);

/**
 * @route DELETE /api/companies/:id
 * @desc Delete company
 * @access Private (system_admin only)
 */
router.delete('/:id', authenticateJWT, requireRole('system_admin'), deleteCompany);

/**
 * @route POST /api/companies/:id/regenerate-api-key
 * @desc Regenerate company API key
 * @access Private (system_admin, company_admin of that company)
 */
router.post('/:id/regenerate-api-key', authenticateJWT, requireRole('system_admin', 'company_admin'), requireCompanyScope, regenerateApiKey);

/**
 * @route POST /api/companies/:id/webhook
 * @desc Register webhook URL for company
 * @access Private (system_admin, company_admin of that company)
 */
router.post('/:id/webhook', authenticateJWT, requireRole('system_admin', 'company_admin'), requireCompanyScope, registerWebhook);

/**
 * @route GET /api/companies/:id/users
 * @desc Get all users for a company
 * @access Private (with scoping)
 */
router.get('/:id/users', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin'), requireCompanyScope, getCompanyUsers);

/**
 * @route POST /api/companies/:id/disconnect-request
 * @desc Create a disconnect request for this company
 * @access Private (company_admin of that company)
 */
router.post('/:id/disconnect-request', authenticateJWT, requireRole('system_admin', 'company_admin'), requireCompanyScope, createDisconnectRequest);

/**
 * @route GET /api/companies/:id/disconnect-requests
 * @desc Get disconnect requests for this company
 * @access Private (company_admin of that company)
 */
router.get('/:id/disconnect-requests', authenticateJWT, requireRole('system_admin', 'company_admin'), requireCompanyScope, getDisconnectRequestsForCompany);

export default router;
