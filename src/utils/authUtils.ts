import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthPayload, JwtPayload } from '../models/types';

// Get JWT secret from environment or use default (for development only)
const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'authenticas-dev-secret-key-2024';
};

// Get JWT expiration in seconds (default 24 hours)
const getJwtExpirationSeconds = (): number => {
  const envValue = process.env.JWT_EXPIRES_IN;
  if (!envValue) return 86400; // 24 hours in seconds
  
  // Parse common formats like "24h", "1d", "30m"
  const match = envValue.match(/^(\d+)([smhd])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
    }
  }
  
  // Try parsing as plain number (seconds)
  const parsed = parseInt(envValue, 10);
  return isNaN(parsed) ? 86400 : parsed;
};

// Generate JWT token
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload as object, getJwtSecret(), {
    expiresIn: getJwtExpirationSeconds()
  });
}

// Verify JWT token
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Compare password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

