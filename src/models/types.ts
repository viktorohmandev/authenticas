// User Role Types
export type UserRole = 'system_admin' | 'retailer_admin' | 'company_admin' | 'company_user';

// Retailer Types
export interface Retailer {
  id: string;
  name: string;
  apiKey: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Company Types (no longer has single retailerId - uses link table)
export interface Company {
  id: string;
  name: string;
  apiKey: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Company-Retailer Link Types (new multi-retailer architecture)
export type LinkStatus = 'active' | 'inactive';

export interface CompanyRetailerLink {
  id: string;
  companyId: string;
  retailerId: string;
  status: LinkStatus;
  createdAt: string;
  updatedAt?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  companyId?: string; // Optional for system_admin and retailer_admin
  retailerId?: string; // For retailer_admin users
  role: UserRole;
  spendingLimit: number;
  spentThisMonth: number; // GLOBAL spending across all retailers
  lastResetDate: string; // ISO date string for monthly reset tracking
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Disconnect Request Types
export type DisconnectRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DisconnectRequest {
  id: string;
  companyId: string;
  retailerId: string;
  status: DisconnectRequestStatus;
  reason?: string;
  requestedBy: string; // userId who requested
  processedBy?: string; // userId who approved/rejected
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export type TransactionStatus = 'approved' | 'denied';
export type DenialReason = 
  | 'limit_exceeded' 
  | 'user_inactive' 
  | 'company_inactive' 
  | 'user_not_found' 
  | 'company_not_found' 
  | 'retailer_not_found'
  | 'not_linked'  // Company not linked to retailer
  | 'insufficient_permissions';

export interface Transaction {
  id: string;
  userId: string;
  companyId: string;
  retailerId: string;
  amount: number;
  status: TransactionStatus;
  denialReason?: DenialReason;
  timestamp: string;
  balanceBefore: number;
  balanceAfter: number;
}

// Audit Types
export type AuditAction = 
  | 'company.created'
  | 'company.updated'
  | 'company.deleted'
  | 'company.apikey.regenerated'
  | 'company.webhook.registered'
  | 'company.disconnect.requested'
  | 'company.disconnect.approved'
  | 'company.disconnect.rejected'
  | 'company.retailer.linked'
  | 'company.retailer.unlinked'
  | 'retailer.created'
  | 'retailer.updated'
  | 'retailer.deleted'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role.changed'
  | 'user.limit.changed'
  | 'user.added_to_company'
  | 'user.removed_from_company'
  | 'purchase.verified'
  | 'purchase.approved'
  | 'purchase.denied'
  | 'auth.login'
  | 'auth.logout'
  | 'monthly.reset';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  performedBy: string; // userId or 'system'
  targetType: 'company' | 'user' | 'transaction' | 'system' | 'retailer' | 'disconnect_request' | 'link';
  targetId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Webhook Types
export type WebhookEvent = 'purchase.approved' | 'purchase.denied' | 'limit.exceeded' | 'disconnect.requested' | 'disconnect.approved' | 'disconnect.rejected';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: {
    transactionId?: string;
    userId?: string;
    companyId?: string;
    retailerId?: string;
    amount?: number;
    status?: TransactionStatus;
    spentThisMonth?: number;
    spendingLimit?: number;
    denialReason?: DenialReason;
    disconnectRequestId?: string;
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  companyId?: string;
  retailerId?: string;
  role: UserRole;
}

export interface JwtPayload extends AuthPayload {
  iat: number;
  exp: number;
}

// Request Types
export interface VerifyPurchaseRequest {
  userId: string;
  companyId: string;
  retailerId: string; // Now required for multi-retailer
  amount: number;
}

export interface CreateRetailerRequest {
  name: string;
  webhookUrl?: string;
}

export interface CreateCompanyRequest {
  name: string;
  webhookUrl?: string;
}

export interface LinkCompanyToRetailerRequest {
  companyId: string;
  retailerId: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  retailerId?: string;
  role?: UserRole;
  spendingLimit?: number;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  spendingLimit?: number;
  isActive?: boolean;
}

export interface UpdateCompanyRequest {
  name?: string;
  webhookUrl?: string;
  isActive?: boolean;
}

export interface UpdateRetailerRequest {
  name?: string;
  webhookUrl?: string;
  isActive?: boolean;
}

export interface RegisterWebhookRequest {
  webhookUrl: string;
}

export interface CreateDisconnectRequest {
  retailerId: string; // Now required - which retailer to disconnect from
  reason?: string;
}
