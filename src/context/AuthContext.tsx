import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatarUrl?: string; role?: string; password?: string }) => Promise<void>;
  loginWithGoogle: (credential: string, mockName?: string, mockEmail?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://product-team-manager-backend.onrender.com/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStoredUser = async () => {
    setLoading(true);
    // Dev branch bypass: if there is no token, set a bypass token
    let storedToken = localStorage.getItem('aether_token');
    if (!storedToken) {
      storedToken = 'bypass_token';
      localStorage.setItem('aether_token', 'bypass_token');
    }

    setToken(storedToken);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Fallback for dev mode when backend has issues or user doesn't exist
        setUser({
          id: 'dev_user_bypass_id',
          name: 'Alex Rivera',
          email: 'alex.rivera@aether.io',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex%20Rivera',
          role: 'Product Manager'
        });
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      // Fallback in dev branch
      setUser({
        id: 'dev_user_bypass_id',
        name: 'Alex Rivera',
        email: 'alex.rivera@aether.io',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex%20Rivera',
        role: 'Product Manager'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoredUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('aether_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Server error during login');
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      localStorage.setItem('aether_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Server error during signup');
      throw err;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string; avatarUrl?: string; role?: string; password?: string }) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update profile');
      }

      setUser(resData);
    } catch (err: any) {
      setError(err.message || 'Server error during profile update');
      throw err;
    }
  };

  const loginWithGoogle = async (credential: string, mockName?: string, mockEmail?: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, mockName, mockEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      localStorage.setItem('aether_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Server error during Google OAuth');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('aether_token');
    loadStoredUser();
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, signup, updateProfile, loginWithGoogle, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
