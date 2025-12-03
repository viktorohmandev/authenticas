import { AuditEntry, AuditAction } from '../models/types';
import { appendToJsonFile, readJsonFile } from '../utils/fileUtils';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { generateId } from '../utils/apiKeyUtils';

const AUDIT_FILE = 'audit.json';

// Create audit entry
export async function createAuditEntry(
  action: AuditAction,
  performedBy: string,
  targetType: AuditEntry['targetType'],
  targetId: string,
  beforeState?: Record<string, unknown>,
  afterState?: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: generateId(),
    timestamp: getCurrentTimestamp(),
    action,
    performedBy,
    targetType,
    targetId,
    beforeState,
    afterState,
    metadata
  };
  
  await appendToJsonFile(AUDIT_FILE, entry);
  console.log(`Audit: ${action} by ${performedBy} on ${targetType}:${targetId}`);
  
  return entry;
}

// Get audit entries for a specific target
export async function getAuditEntriesForTarget(
  targetType: AuditEntry['targetType'],
  targetId: string
): Promise<AuditEntry[]> {
  const entries = await readJsonFile<AuditEntry>(AUDIT_FILE);
  return entries.filter(e => e.targetType === targetType && e.targetId === targetId);
}

// Get audit entries by action
export async function getAuditEntriesByAction(action: AuditAction): Promise<AuditEntry[]> {
  const entries = await readJsonFile<AuditEntry>(AUDIT_FILE);
  return entries.filter(e => e.action === action);
}

// Get audit entries by user
export async function getAuditEntriesByUser(userId: string): Promise<AuditEntry[]> {
  const entries = await readJsonFile<AuditEntry>(AUDIT_FILE);
  return entries.filter(e => e.performedBy === userId);
}

// Get all audit entries (with optional pagination)
export async function getAllAuditEntries(
  limit?: number,
  offset?: number
): Promise<{ entries: AuditEntry[]; total: number }> {
  const entries = await readJsonFile<AuditEntry>(AUDIT_FILE);
  
  // Sort by timestamp descending (newest first)
  const sorted = entries.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const total = sorted.length;
  
  if (limit !== undefined && offset !== undefined) {
    return {
      entries: sorted.slice(offset, offset + limit),
      total
    };
  }
  
  return { entries: sorted, total };
}

// Get recent audit entries
export async function getRecentAuditEntries(count: number = 50): Promise<AuditEntry[]> {
  const { entries } = await getAllAuditEntries(count, 0);
  return entries;
}

// Convenience functions for common audit actions
export const audit = {
  // Company actions
  companyCreated: (performedBy: string, companyId: string, afterState: Record<string, unknown>) =>
    createAuditEntry('company.created', performedBy, 'company', companyId, undefined, afterState),
  
  companyUpdated: (performedBy: string, companyId: string, beforeState: Record<string, unknown>, afterState: Record<string, unknown>) =>
    createAuditEntry('company.updated', performedBy, 'company', companyId, beforeState, afterState),
  
  companyDeleted: (performedBy: string, companyId: string, beforeState: Record<string, unknown>) =>
    createAuditEntry('company.deleted', performedBy, 'company', companyId, beforeState),
  
  apiKeyRegenerated: (performedBy: string, companyId: string) =>
    createAuditEntry('company.apikey.regenerated', performedBy, 'company', companyId),
  
  webhookRegistered: (performedBy: string, companyId: string, webhookUrl: string) =>
    createAuditEntry('company.webhook.registered', performedBy, 'company', companyId, undefined, { webhookUrl }),
  
  // Retailer actions
  retailerCreated: (performedBy: string, retailerId: string, afterState: Record<string, unknown>) =>
    createAuditEntry('retailer.created', performedBy, 'retailer', retailerId, undefined, afterState),
  
  retailerUpdated: (performedBy: string, retailerId: string, beforeState: Record<string, unknown>, afterState: Record<string, unknown>) =>
    createAuditEntry('retailer.updated', performedBy, 'retailer', retailerId, beforeState, afterState),
  
  retailerDeleted: (performedBy: string, retailerId: string, beforeState: Record<string, unknown>) =>
    createAuditEntry('retailer.deleted', performedBy, 'retailer', retailerId, beforeState),
  
  // Disconnect request actions
  disconnectRequested: (performedBy: string, companyId: string, retailerId: string) =>
    createAuditEntry('company.disconnect.requested', performedBy, 'disconnect_request', companyId, undefined, undefined, { retailerId }),
  
  disconnectApproved: (performedBy: string, companyId: string, retailerId: string) =>
    createAuditEntry('company.disconnect.approved', performedBy, 'disconnect_request', companyId, undefined, undefined, { retailerId }),
  
  disconnectRejected: (performedBy: string, companyId: string, retailerId: string) =>
    createAuditEntry('company.disconnect.rejected', performedBy, 'disconnect_request', companyId, undefined, undefined, { retailerId }),
  
  // User actions
  userCreated: (performedBy: string, userId: string, afterState: Record<string, unknown>) =>
    createAuditEntry('user.created', performedBy, 'user', userId, undefined, afterState),
  
  userUpdated: (performedBy: string, userId: string, beforeState: Record<string, unknown>, afterState: Record<string, unknown>) =>
    createAuditEntry('user.updated', performedBy, 'user', userId, beforeState, afterState),
  
  userDeleted: (performedBy: string, userId: string, beforeState: Record<string, unknown>) =>
    createAuditEntry('user.deleted', performedBy, 'user', userId, beforeState),
  
  userRoleChanged: (performedBy: string, userId: string, oldRole: string, newRole: string) =>
    createAuditEntry('user.role.changed', performedBy, 'user', userId, { role: oldRole }, { role: newRole }),
  
  userLimitChanged: (performedBy: string, userId: string, oldLimit: number, newLimit: number) =>
    createAuditEntry('user.limit.changed', performedBy, 'user', userId, { spendingLimit: oldLimit }, { spendingLimit: newLimit }),
  
  userAddedToCompany: (performedBy: string, userId: string, companyId: string) =>
    createAuditEntry('user.added_to_company', performedBy, 'user', userId, undefined, undefined, { companyId }),
  
  userRemovedFromCompany: (performedBy: string, userId: string, companyId: string) =>
    createAuditEntry('user.removed_from_company', performedBy, 'user', userId, undefined, undefined, { companyId }),
  
  // Purchase actions
  purchaseApproved: (userId: string, transactionId: string, amount: number, beforeBalance: number, afterBalance: number) =>
    createAuditEntry('purchase.approved', userId, 'transaction', transactionId, 
      { spentThisMonth: beforeBalance }, 
      { spentThisMonth: afterBalance },
      { amount }),
  
  purchaseDenied: (userId: string, transactionId: string, amount: number, reason: string) =>
    createAuditEntry('purchase.denied', userId, 'transaction', transactionId, undefined, undefined, { amount, reason }),
  
  // Auth actions
  userLogin: (userId: string) =>
    createAuditEntry('auth.login', userId, 'user', userId),
  
  // System actions
  monthlyReset: (userId: string, previousSpent: number) =>
    createAuditEntry('monthly.reset', 'system', 'user', userId, { spentThisMonth: previousSpent }, { spentThisMonth: 0 })
};
