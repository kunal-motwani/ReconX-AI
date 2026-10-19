'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#030509]">
        <LoadingSpinner size="lg" label="INITIALIZING BLOOMBERG RECONX TERMINAL..." />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-yellow-400 font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-20 bg-[#0a0a0a]">
          {children}
        </main>
      </div>
    </div>
  );
};
