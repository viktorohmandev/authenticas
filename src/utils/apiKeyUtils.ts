import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate a secure API key
export function generateApiKey(): string {
  const prefix = 'ak_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

// Generate a UUID
export function generateId(): string {
  return uuidv4();
}

// Validate API key format
export function isValidApiKeyFormat(apiKey: string): boolean {
  return /^ak_[a-f0-9]{64}$/.test(apiKey);
}

// Mask API key for display (show first 8 and last 4 characters)
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return '****';
  }
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

