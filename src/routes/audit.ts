import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { 
  getAllAuditEntries, 
  getAuditEntriesForTarget,
  getAuditEntriesByUser,
  getRecentAuditEntries
} from '../services/auditService';
import { ApiResponse } from '../models/types';

const router = Router();

/**
 * @route GET /api/audit
 * @desc Get all audit entries (with pagination)
 * @access Private (system_admin only)
 */
router.get('/', authenticateJWT, requireRole('system_admin'), async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    
    const { entries, total } = await getAllAuditEntries(limit, offset);
    
    const response: ApiResponse = {
      success: true,
      data: {
        entries,
        total,
        limit,
        offset
      }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch audit entries'
    };
    res.status(500).json(response);
  }
});

/**
 * @route GET /api/audit/recent
 * @desc Get recent audit entries
 * @access Private (system_admin only)
 */
router.get('/recent', authenticateJWT, requireRole('system_admin'), async (req: Request, res: Response) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 50;
    const entries = await getRecentAuditEntries(count);
    
    const response: ApiResponse = {
      success: true,
      data: entries
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch recent audit entries'
    };
    res.status(500).json(response);
  }
});

/**
 * @route GET /api/audit/user/:userId
 * @desc Get audit entries for a specific user
 * @access Private (system_admin only)
 */
router.get('/user/:userId', authenticateJWT, requireRole('system_admin'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const entries = await getAuditEntriesByUser(userId);
    
    const response: ApiResponse = {
      success: true,
      data: entries
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user audit entries'
    };
    res.status(500).json(response);
  }
});

/**
 * @route GET /api/audit/target/:type/:id
 * @desc Get audit entries for a specific target
 * @access Private (system_admin only)
 */
router.get('/target/:type/:id', authenticateJWT, requireRole('system_admin'), async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    
    if (!['company', 'user', 'transaction', 'system', 'retailer', 'disconnect_request'].includes(type)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid target type. Must be one of: company, user, transaction, system, retailer, disconnect_request'
      };
      res.status(400).json(response);
      return;
    }
    
    const entries = await getAuditEntriesForTarget(type as 'company' | 'user' | 'transaction' | 'system' | 'retailer' | 'disconnect_request', id);
    
    const response: ApiResponse = {
      success: true,
      data: entries
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch target audit entries'
    };
    res.status(500).json(response);
  }
});

export default router;
