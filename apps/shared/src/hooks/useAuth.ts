import { useState, useEffect, useCallback } from 'react';
import { authApi, setToken, clearToken } from '../utils/api';
import type { User, AuthState } from '../types';

const STORAGE_KEY = 'auth_token';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      setToken(token);
      fetchUser();
    } else {
      setState((prev: AuthState) => ({ ...prev, isLoading: false }));
    }
  }, []);
  
  const fetchUser = async () => {
    const response = await authApi.me();
    if (response.success && response.data) {
      setState({
        user: response.data as User,
        token: localStorage.getItem(STORAGE_KEY),
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // Token invalid, clear it
      clearToken();
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
  }, []);
  
  const logout = useCallback(() => {
    clearToken();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);
  
  const refreshToken = useCallback(async () => {
    const response = await authApi.refresh();
    if (response.success && response.data) {
      setToken(response.data.token);
      setState((prev: AuthState) => ({
        ...prev,
        token: response.data!.token,
      }));
      return true;
    }
    return false;
  }, []);
  
  return {
    ...state,
    login,
    logout,
    refreshToken,
  };
}

