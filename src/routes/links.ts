import { Router } from 'express';
import {
  getAllLinks,
  getCompaniesForRetailer,
  getRetailersForCompany,
  createLink
} from '../controllers/linkController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/links
 * @desc Get all company-retailer links
 * @access Private (system_admin only)
 */
router.get('/', authenticateJWT, requireRole('system_admin'), getAllLinks);

/**
 * @route POST /api/links
 * @desc Create a new company-retailer link
 * @access Private (system_admin only)
 */
router.post('/', authenticateJWT, requireRole('system_admin'), createLink);

/**
 * @route GET /api/retailers/:id/companies
 * @desc Get all companies linked to a retailer
 * @access Private (system_admin, retailer_admin of that retailer)
 */
router.get('/retailers/:id/companies', authenticateJWT, requireRole('system_admin', 'retailer_admin'), getCompaniesForRetailer);

/**
 * @route GET /api/companies/:id/retailers
 * @desc Get all retailers linked to a company
 * @access Private (system_admin, company_admin, company_user of that company)
 */
router.get('/companies/:id/retailers', authenticateJWT, requireRole('system_admin', 'company_admin', 'company_user'), getRetailersForCompany);

export default router;

