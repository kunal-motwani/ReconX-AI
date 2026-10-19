'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Company } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrCredentials: any, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchProfile: (targetUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('reconx_token');
    const savedUser = localStorage.getItem('reconx_user');
    const savedCompany = localStorage.getItem('reconx_company');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
      if (savedCompany) {
        try {
          setCompany(JSON.parse(savedCompany));
        } catch (e) {}
      }
      setIsLoading(false);
    } else {
      // Auto-provision default Finance Manager session so hotkeys [F1-F10] and modules work immediately
      const defaultUser: User = {
        id: 'usr-mgr-02',
        companyId: 'cmp-abctech-01',
        email: 'manager@abctech.com',
        firstName: 'Priya',
        lastName: 'Nair',
        role: 'FINANCE_MANAGER',
        active: true,
        createdAt: '2026-08-01T09:05:00.000Z',
      };
      const defaultToken = 'reconx-jwt-sim-usr-mgr-02';
      setToken(defaultToken);
      setUser(defaultUser);
      localStorage.setItem('reconx_token', defaultToken);
      localStorage.setItem('reconx_user', JSON.stringify(defaultUser));
      setIsLoading(false);
    }
  }, []);

  const login = async (emailOrCredentials: any, passwordParam?: string) => {
    setIsLoading(true);
    try {
      const credentials = typeof emailOrCredentials === 'string'
        ? { email: emailOrCredentials, password: passwordParam || '' }
        : emailOrCredentials;

      const res: any = await authApi.login(credentials);
      const data = res.data || res;
      const authToken = data.token;
      const authUser = data.user;
      const authCompany = data.company;

      if (!authToken || !authUser) {
        throw new Error('Invalid authentication response structure');
      }

      setToken(authToken);
      setUser(authUser);
      if (authCompany) setCompany(authCompany);

      localStorage.setItem('reconx_token', authToken);
      localStorage.setItem('reconx_user', JSON.stringify(authUser));
      if (authCompany) localStorage.setItem('reconx_company', JSON.stringify(authCompany));

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res: any = await authApi.register(data);
      const resData = res.data || res;
      setToken(resData.token);
      setUser(resData.user);
      setCompany(resData.company);
      localStorage.setItem('reconx_token', resData.token);
      localStorage.setItem('reconx_user', JSON.stringify(resData.user));
      localStorage.setItem('reconx_company', JSON.stringify(resData.company));
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('reconx_token');
    localStorage.removeItem('reconx_user');
    localStorage.removeItem('reconx_company');
    setToken(null);
    setUser(null);
    setCompany(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const userData: any = await authApi.me();
      const userObj = userData.user || userData;
      setUser(userObj);
      localStorage.setItem('reconx_user', JSON.stringify(userObj));
    } catch (e) {
      console.error(e);
    }
  };

  const switchProfile = (targetUser: User) => {
    const newToken = `reconx-jwt-sim-${targetUser.id}`;
    setToken(newToken);
    setUser(targetUser);
    localStorage.setItem('reconx_token', newToken);
    localStorage.setItem('reconx_user', JSON.stringify(targetUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        switchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
