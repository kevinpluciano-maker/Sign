import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken, clearAuthToken } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: if token exists, verify with backend and fetch user
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<User>(API_ENDPOINTS.me, { auth: true })
      .then((u) => setUser(u))
      .catch(() => {
        clearAuthToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: User }>(API_ENDPOINTS.login, {
        method: 'POST',
        json: { email: email.toLowerCase().trim(), password },
      });
      setAuthToken(data.token);
      setUser(data.user);
      return true;
    } catch (e: any) {
      setError(e.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (_email: string, _password: string, _name: string): Promise<boolean> => {
    // Public signup not supported in this admin-only auth system.
    setError('Registration is disabled. Please contact the administrator.');
    return false;
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
