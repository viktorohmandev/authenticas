import { Router } from 'express';
import { login, getCurrentUser, refreshToken } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Login user and get JWT token
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private (JWT)
 */
router.get('/me', authenticateJWT, getCurrentUser);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 * @access Private (JWT)
 */
router.post('/refresh', authenticateJWT, refreshToken);

export default router;

