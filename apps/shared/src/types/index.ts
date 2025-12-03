// User Role Types
export type UserRole = 'system_admin' | 'retailer_admin' | 'company_admin' | 'company_user';

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  retailerId?: string;
  role: UserRole;
  spendingLimit?: number;
  spentThisMonth?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

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

// Company-Retailer Link Types (multi-retailer architecture)
export type LinkStatus = 'active' | 'inactive';

export interface CompanyRetailerLink {
  id: string;
  companyId: string;
  retailerId: string;
  status: LinkStatus;
  createdAt: string;
  updatedAt?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  companyId: string;
  retailerId: string;
  amount: number;
  status: 'approved' | 'denied';
  denialReason?: string;
  timestamp: string;
  balanceBefore: number;
  balanceAfter: number;
}

// Disconnect Request Types
export type DisconnectRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DisconnectRequest {
  id: string;
  companyId: string;
  retailerId: string;
  status: DisconnectRequestStatus;
  reason?: string;
  requestedBy: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface CreateRetailerForm {
  name: string;
  webhookUrl?: string;
}

export interface CreateCompanyForm {
  name: string;
  webhookUrl?: string;
}

export interface CreateLinkForm {
  companyId: string;
  retailerId: string;
}

export interface CreateUserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  retailerId?: string;
  role: UserRole;
  spendingLimit: number;
}

export interface UpdateUserForm {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  spendingLimit?: number;
  isActive?: boolean;
}

export interface WebhookTestForm {
  webhookUrl: string;
}

export interface VerifyPurchaseForm {
  userId: string;
  companyId: string;
  retailerId: string; // Now required for multi-retailer
  amount: number;
}

export interface CreateDisconnectRequestForm {
  retailerId: string; // Now required - which retailer to disconnect from
  reason?: string;
}

// Audit Types
export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Role check helpers
export const isSystemAdmin = (role?: UserRole): boolean => role === 'system_admin';
export const isRetailerAdmin = (role?: UserRole): boolean => role === 'retailer_admin';
export const isCompanyAdmin = (role?: UserRole): boolean => role === 'company_admin';
export const isCompanyUser = (role?: UserRole): boolean => role === 'company_user';

export const canAccessAdminDashboard = (role?: UserRole): boolean => 
  role === 'system_admin';

export const canAccessRetailerDashboard = (role?: UserRole): boolean => 
  role === 'system_admin' || role === 'retailer_admin';

export const canAccessCompanyDashboard = (role?: UserRole): boolean => 
  role === 'system_admin' || role === 'company_admin' || role === 'company_user';

export const canManageUsers = (role?: UserRole): boolean =>
  role === 'system_admin' || role === 'company_admin';

export const canManageCompany = (role?: UserRole): boolean =>
  role === 'system_admin' || role === 'company_admin';

export const canViewAuditLogs = (role?: UserRole): boolean =>
  role === 'system_admin';
