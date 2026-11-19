import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/asset.types';
import { api } from '../api/apiClient';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('assetpulse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('assetpulse_user', JSON.stringify(user));
      if (user.token) {
        localStorage.setItem('assetpulse_token', user.token);
      }
    } else {
      localStorage.removeItem('assetpulse_user');
      localStorage.removeItem('assetpulse_token');
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    const response = await api.post<User>('/api/v1/auth/login', { username, password });
    setUser(response);
  };

  const logout = () => {
    setUser(null);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
