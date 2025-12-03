import type { ApiResponse, DisconnectRequest, Retailer, CompanyRetailerLink, Company } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Get stored token
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Set stored token
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Clear stored token
export function clearToken(): void {
  localStorage.removeItem('auth_token');
}

// API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  me: () => apiFetch<any>('/api/auth/me'),
  
  refresh: () =>
    apiFetch<{ token: string }>('/api/auth/refresh', { method: 'POST' }),
};

// Retailers API
export const retailersApi = {
  list: () => apiFetch<Retailer[]>('/api/retailers'),
  
  get: (id: string) => apiFetch<Retailer>(`/api/retailers/${id}`),
  
  create: (data: { name: string; webhookUrl?: string }) =>
    apiFetch<Retailer>('/api/retailers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    apiFetch<Retailer>(`/api/retailers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiFetch<void>(`/api/retailers/${id}`, { method: 'DELETE' }),
  
  regenerateApiKey: (id: string) =>
    apiFetch<{ apiKey: string }>(`/api/retailers/${id}/regenerate-api-key`, {
      method: 'POST',
    }),
  
  registerWebhook: (id: string, webhookUrl: string) =>
    apiFetch<Retailer>(`/api/retailers/${id}/webhook`, {
      method: 'POST',
      body: JSON.stringify({ webhookUrl }),
    }),
  
  // Get companies linked to this retailer (via link table)
  getCompanies: (id: string) =>
    apiFetch<Company[]>(`/api/links/retailers/${id}/companies`),
};

// Companies API
export const companiesApi = {
  list: () => apiFetch<any[]>('/api/companies'),
  
  get: (id: string) => apiFetch<any>(`/api/companies/${id}`),
  
  // Updated: no longer requires retailerId
  create: (data: { name: string; webhookUrl?: string }) =>
    apiFetch<any>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiFetch<void>(`/api/companies/${id}`, { method: 'DELETE' }),
  
  regenerateApiKey: (id: string) =>
    apiFetch<{ apiKey: string }>(`/api/companies/${id}/regenerate-api-key`, {
      method: 'POST',
    }),
  
  registerWebhook: (id: string, webhookUrl: string) =>
    apiFetch<any>(`/api/companies/${id}/webhook`, {
      method: 'POST',
      body: JSON.stringify({ webhookUrl }),
    }),
  
  getUsers: (id: string) => apiFetch<any[]>(`/api/companies/${id}/users`),
  
  // Get retailers linked to this company (via link table)
  getRetailers: (id: string) =>
    apiFetch<Retailer[]>(`/api/links/companies/${id}/retailers`),
  
  // Updated: now requires retailerId for multi-retailer
  createDisconnectRequest: (id: string, retailerId: string, reason?: string) =>
    apiFetch<DisconnectRequest>(`/api/companies/${id}/disconnect-request`, {
      method: 'POST',
      body: JSON.stringify({ retailerId, reason }),
    }),
  
  getDisconnectRequests: (id: string) =>
    apiFetch<DisconnectRequest[]>(`/api/companies/${id}/disconnect-requests`),
};

// Links API (for multi-retailer relationships)
export const linksApi = {
  // Get all links (system_admin only)
  list: () => apiFetch<CompanyRetailerLink[]>('/api/links'),
  
  // Create a new company-retailer link
  create: (companyId: string, retailerId: string) =>
    apiFetch<CompanyRetailerLink>('/api/links', {
      method: 'POST',
      body: JSON.stringify({ companyId, retailerId }),
    }),
  
  // Get companies for a retailer
  getCompaniesForRetailer: (retailerId: string) =>
    apiFetch<Company[]>(`/api/links/retailers/${retailerId}/companies`),
  
  // Get retailers for a company
  getRetailersForCompany: (companyId: string) =>
    apiFetch<Retailer[]>(`/api/links/companies/${companyId}/retailers`),
};

// Users API
export const usersApi = {
  list: () => apiFetch<any[]>('/api/users'),
  
  get: (id: string) => apiFetch<any>(`/api/users/${id}`),
  
  me: () => apiFetch<any>('/api/users/me'),
  
  create: (data: any) =>
    apiFetch<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiFetch<void>(`/api/users/${id}`, { method: 'DELETE' }),
  
  setSpendingLimit: (id: string, spendingLimit: number) =>
    apiFetch<any>(`/api/users/${id}/spending-limit`, {
      method: 'PUT',
      body: JSON.stringify({ spendingLimit }),
    }),
};

// Transactions API
export const transactionsApi = {
  list: () => apiFetch<any[]>('/api/transactions'),
  
  get: (id: string) => apiFetch<any>(`/api/transactions/${id}`),
  
  getByUser: (userId: string) =>
    apiFetch<any[]>(`/api/transactions/user/${userId}`),
  
  getByCompany: (companyId: string) =>
    apiFetch<any[]>(`/api/transactions/company/${companyId}`),
  
  // Updated: now requires retailerId for multi-retailer
  verify: (data: { userId: string; companyId: string; retailerId: string; amount: number }) =>
    apiFetch<any>('/verifyPurchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Disconnect Requests API
export const disconnectRequestsApi = {
  list: () => apiFetch<DisconnectRequest[]>('/api/disconnect-requests'),
  
  get: (id: string) => apiFetch<DisconnectRequest>(`/api/disconnect-requests/${id}`),
  
  approve: (id: string) =>
    apiFetch<DisconnectRequest>(`/api/disconnect-requests/${id}/approve`, {
      method: 'POST',
    }),
  
  reject: (id: string) =>
    apiFetch<DisconnectRequest>(`/api/disconnect-requests/${id}/reject`, {
      method: 'POST',
    }),
};

// Audit API
export const auditApi = {
  list: (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return apiFetch<{ entries: any[]; total: number }>(
      `/api/audit?${params.toString()}`
    );
  },
  
  recent: (count?: number) =>
    apiFetch<any[]>(`/api/audit/recent${count ? `?count=${count}` : ''}`),
  
  byUser: (userId: string) => apiFetch<any[]>(`/api/audit/user/${userId}`),
  
  byTarget: (type: string, id: string) =>
    apiFetch<any[]>(`/api/audit/target/${type}/${id}`),
};

export default {
  auth: authApi,
  retailers: retailersApi,
  companies: companiesApi,
  links: linksApi,
  users: usersApi,
  transactions: transactionsApi,
  disconnectRequests: disconnectRequestsApi,
  audit: auditApi,
};
