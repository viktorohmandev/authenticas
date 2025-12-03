import { Router } from 'express';
import {
  getAllRetailers,
  getRetailerById,
  createRetailer,
  updateRetailer,
  deleteRetailer,
  regenerateRetailerApiKey,
  registerRetailerWebhook
} from '../controllers/retailerController';
import { authenticateJWT, requireRole, requireRetailerScope } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route GET /api/retailers
 * @desc Get all retailers
 * @access Private (system_admin only)
 */
router.get('/', authenticateJWT, requireRole('system_admin'), getAllRetailers);

/**
 * @route GET /api/retailers/:id
 * @desc Get retailer by ID
 * @access Private (system_admin, retailer_admin of that retailer)
 */
router.get('/:id', authenticateJWT, requireRole('system_admin', 'retailer_admin'), getRetailerById);

/**
 * @route POST /api/retailers
 * @desc Create new retailer
 * @access Private (system_admin only)
 */
router.post('/', authenticateJWT, requireRole('system_admin'), createRetailer);

/**
 * @route PUT /api/retailers/:id
 * @desc Update retailer
 * @access Private (system_admin, retailer_admin of that retailer)
 */
router.put('/:id', authenticateJWT, requireRole('system_admin', 'retailer_admin'), updateRetailer);

/**
 * @route DELETE /api/retailers/:id
 * @desc Delete retailer
 * @access Private (system_admin only)
 */
router.delete('/:id', authenticateJWT, requireRole('system_admin'), deleteRetailer);

/**
 * @route POST /api/retailers/:id/regenerate-api-key
 * @desc Regenerate retailer API key
 * @access Private (system_admin, retailer_admin of that retailer)
 */
router.post('/:id/regenerate-api-key', authenticateJWT, requireRole('system_admin', 'retailer_admin'), regenerateRetailerApiKey);

/**
 * @route POST /api/retailers/:id/webhook
 * @desc Register webhook URL for retailer
 * @access Private (system_admin, retailer_admin of that retailer)
 */
router.post('/:id/webhook', authenticateJWT, requireRole('system_admin', 'retailer_admin'), registerRetailerWebhook);

export default router;

