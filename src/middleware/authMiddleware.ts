import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/authUtils';
import { JwtPayload, ApiResponse, UserRole } from '../models/types';
import { findBy, findById } from '../utils/fileUtils';
import { Company, Retailer } from '../models/types';

const COMPANIES_FILE = 'companies.json';
const RETAILERS_FILE = 'retailers.json';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      apiKey?: string;
      company?: Company;
      retailer?: Retailer;
    }
  }
}

// JWT Authentication middleware
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required. Please provide a valid JWT token.'
    };
    res.status(401).json(response);
    return;
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token.'
    };
    res.status(401).json(response);
    return;
  }
  
  req.user = payload;
  next();
}

// Role-based access control middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required.'
      };
      res.status(401).json(response);
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      };
      res.status(403).json(response);
      return;
    }
    
    next();
  };
}

// Legacy admin role check middleware (for backwards compatibility)
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required.'
    };
    res.status(401).json(response);
    return;
  }
  
  if (req.user.role !== 'system_admin') {
    const response: ApiResponse = {
      success: false,
      error: 'System admin privileges required.'
    };
    res.status(403).json(response);
    return;
  }
  
  next();
}

// Company scoping middleware - ensures user can only access their own company's resources
export function requireCompanyScope(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required.'
    };
    res.status(401).json(response);
    return;
  }
  
  // System admin can access all companies
  if (req.user.role === 'system_admin') {
    next();
    return;
  }
  
  // Retailer admin can access companies linked to their retailer
  if (req.user.role === 'retailer_admin') {
    // Will be validated in route handlers
    next();
    return;
  }
  
  // Company admin and company user must have a companyId
  if (!req.user.companyId) {
    const response: ApiResponse = {
      success: false,
      error: 'No company associated with this user.'
    };
    res.status(403).json(response);
    return;
  }
  
  // Check if the requested company matches user's company
  const requestedCompanyId = req.params.id || req.params.companyId || req.body?.companyId;
  
  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    const response: ApiResponse = {
      success: false,
      error: 'Access denied. You can only access your own company resources.'
    };
    res.status(403).json(response);
    return;
  }
  
  next();
}

// Retailer scoping middleware - ensures retailer_admin can only access their own retailer's resources
export function requireRetailerScope(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required.'
    };
    res.status(401).json(response);
    return;
  }
  
  // System admin can access all retailers
  if (req.user.role === 'system_admin') {
    next();
    return;
  }
  
  // Only retailer_admin should use this middleware
  if (req.user.role !== 'retailer_admin') {
    const response: ApiResponse = {
      success: false,
      error: 'Access denied. Retailer admin privileges required.'
    };
    res.status(403).json(response);
    return;
  }
  
  // Retailer admin must have a retailerId
  if (!req.user.retailerId) {
    const response: ApiResponse = {
      success: false,
      error: 'No retailer associated with this user.'
    };
    res.status(403).json(response);
    return;
  }
  
  // Check if the requested retailer matches user's retailer
  const requestedRetailerId = req.params.id || req.params.retailerId || req.body?.retailerId;
  
  if (requestedRetailerId && requestedRetailerId !== req.user.retailerId) {
    const response: ApiResponse = {
      success: false,
      error: 'Access denied. You can only access your own retailer resources.'
    };
    res.status(403).json(response);
    return;
  }
  
  next();
}

// Self-only access middleware - for company_user to access only their own data
export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required.'
    };
    res.status(401).json(response);
    return;
  }
  
  // System admin can access all
  if (req.user.role === 'system_admin') {
    next();
    return;
  }
  
  // Company admin can access users in their company
  if (req.user.role === 'company_admin') {
    next();
    return;
  }
  
  // Company user can only access their own data
  const requestedUserId = req.params.id || req.params.userId;
  
  if (requestedUserId && requestedUserId !== req.user.userId) {
    const response: ApiResponse = {
      success: false,
      error: 'Access denied. You can only access your own data.'
    };
    res.status(403).json(response);
    return;
  }
  
  next();
}

// API Key authentication middleware (for external API access)
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    const response: ApiResponse = {
      success: false,
      error: 'API key required. Please provide X-API-Key header.'
    };
    res.status(401).json(response);
    return;
  }
  
  try {
    // Try to find company with this API key
    const company = await findBy<Company>(COMPANIES_FILE, (c) => c.apiKey === apiKey && c.isActive);
    
    if (company) {
      req.apiKey = apiKey;
      req.company = company;
      next();
      return;
    }
    
    // Try to find retailer with this API key
    const retailer = await findBy<Retailer>(RETAILERS_FILE, (r) => r.apiKey === apiKey && r.isActive);
    
    if (retailer) {
      req.apiKey = apiKey;
      req.retailer = retailer;
      next();
      return;
    }
    
    const response: ApiResponse = {
      success: false,
      error: 'Invalid API key or entity is inactive.'
    };
    res.status(401).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication error.'
    };
    res.status(500).json(response);
  }
}

// Combined auth middleware - accepts either JWT or API key
export async function authenticateAny(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  const apiKey = req.headers['x-api-key'] as string;
  
  // Try JWT first
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      next();
      return;
    }
  }
  
  // Try API key
  if (apiKey) {
    try {
      const company = await findBy<Company>(COMPANIES_FILE, (c) => c.apiKey === apiKey && c.isActive);
      if (company) {
        req.apiKey = apiKey;
        req.company = company;
        next();
        return;
      }
      
      const retailer = await findBy<Retailer>(RETAILERS_FILE, (r) => r.apiKey === apiKey && r.isActive);
      if (retailer) {
        req.apiKey = apiKey;
        req.retailer = retailer;
        next();
        return;
      }
    } catch (error) {
      // Continue to error response
    }
  }
  
  const response: ApiResponse = {
    success: false,
    error: 'Authentication required. Please provide a valid JWT token or API key.'
  };
  res.status(401).json(response);
}
