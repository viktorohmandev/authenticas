import { useState, useEffect, useCallback } from 'react';
import { authApi, setToken, clearToken } from '../utils/api';
import type { User, AuthState } from '../types';

// Use different storage keys for each app to allow multiple logins
function getStorageKey(): string {
  if (typeof window === 'undefined') return 'auth_token';
  const path = window.location.pathname;
  if (path.startsWith('/admin-login')) return 'admin_auth_token';
  if (path.startsWith('/company-login')) return 'company_auth_token';
  if (path.startsWith('/retailer-login')) return 'retailer_auth_token';
  return 'auth_token';
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const storageKey = getStorageKey();
  
  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(storageKey);
    if (token) {
      setToken(token);
      fetchUser();
    } else {
      setState((prev: AuthState) => ({ ...prev, isLoading: false }));
    }
  }, [storageKey]);
  
  const fetchUser = async () => {
    const response = await authApi.me();
    if (response.success && response.data) {
      setState({
        user: response.data as User,
        token: localStorage.getItem(storageKey),
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // Token invalid, clear it
      clearToken();
      localStorage.removeItem(storageKey);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };
  
  const login = useCallback(async (email: string, password: string) => {
    setState((prev: AuthState) => ({ ...prev, isLoading: true }));
    
    const response = await authApi.login(email, password);
    
    if (response.success && response.data) {
      const { token, user } = response.data;
      setToken(token);
      localStorage.setItem(storageKey, token);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    }
    
    setState((prev: AuthState) => ({ ...prev, isLoading: false }));
    return { success: false, error: response.error || 'Login failed' };
  }, [storageKey]);
  
  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(storageKey);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [storageKey]);
  
  const refreshToken = useCallback(async () => {
    const response = await authApi.refresh();
    if (response.success && response.data) {
      setToken(response.data.token);
      localStorage.setItem(storageKey, response.data.token);
      setState((prev: AuthState) => ({
        ...prev,
        token: response.data!.token,
      }));
      return true;
    }
    return false;
  }, [storageKey]);
  
  return {
    ...state,
    login,
    logout,
    refreshToken,
  };
}
