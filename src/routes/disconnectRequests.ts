import { Router } from 'express';
import {
  createDisconnectRequest,
  getDisconnectRequestsForRetailer,
  getDisconnectRequestsForCompany,
  getDisconnectRequestById,
  approveDisconnectRequest,
  rejectDisconnectRequest
} from '../controllers/disconnectRequestController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/disconnect-requests
 * @desc Get disconnect requests (for retailer_admin: their retailer's requests, for system_admin: all)
 * @access Private (system_admin, retailer_admin)
 */
router.get('/', authenticateJWT, requireRole('system_admin', 'retailer_admin'), getDisconnectRequestsForRetailer);

/**
 * @route GET /api/disconnect-requests/:id
 * @desc Get disconnect request by ID
 * @access Private (system_admin, retailer_admin, company_admin)
 */
router.get('/:id', authenticateJWT, requireRole('system_admin', 'retailer_admin', 'company_admin'), getDisconnectRequestById);

/**
 * @route POST /api/disconnect-requests/:id/approve
 * @desc Approve a disconnect request
 * @access Private (system_admin, retailer_admin)
 */
router.post('/:id/approve', authenticateJWT, requireRole('system_admin', 'retailer_admin'), approveDisconnectRequest);

/**
 * @route POST /api/disconnect-requests/:id/reject
 * @desc Reject a disconnect request
 * @access Private (system_admin, retailer_admin)
 */
router.post('/:id/reject', authenticateJWT, requireRole('system_admin', 'retailer_admin'), rejectDisconnectRequest);

export default router;

