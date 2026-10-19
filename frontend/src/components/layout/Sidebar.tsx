'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  GitCompare,
  AlertTriangle,
  SearchCheck,
  CheckSquare,
  BookOpen,
  BarChart3,
  History,
  Settings,
  Users,
  Building2,
  Terminal,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, company } = useAuth();

  const navigation = [
    { name: 'Terminal Center', shortcut: 'F1', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Document Vault', shortcut: 'F2', href: '/documents', icon: FileText },
    { name: 'Ledger Feed', shortcut: 'F3', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Smart Matcher', shortcut: 'F4', href: '/reconciliation', icon: GitCompare, highlight: true },
    { name: 'Anomaly Center', shortcut: 'F5', href: '/anomalies', icon: AlertTriangle, badge: 'ALERT' },
    { name: 'AI Root Cause', shortcut: 'F6', href: '/investigations', icon: SearchCheck },
    { name: 'Human Approvals', shortcut: 'F7', href: '/review', icon: CheckSquare, badge: 'QUEUE' },
    { name: 'Chart of Accounts', shortcut: 'F8', href: '/gl-codes', icon: BookOpen },
    { name: 'Analytics', shortcut: 'F9', href: '/reports', icon: BarChart3 },
    { name: 'Audit Trail', shortcut: 'F10', href: '/audit-logs', icon: History },
  ];

  const adminNav = [
    { name: 'System Settings', href: '/settings', icon: Settings },
    { name: 'User Directory', href: '/users', icon: Users },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#262626] bg-[#0a0a0a] flex flex-col h-screen select-none relative z-20 font-terminal">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#262626] bg-[#121212]">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-[#1c1c1c] border border-[#333333] text-orange-500 font-bold shadow-md">
          <Terminal className="w-5 h-5 animate-pulse text-orange-500" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-widest text-orange-500 uppercase">RECONX</span>
            <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400 border border-yellow-500/40 uppercase">
              MVP
            </span>
          </div>
          <p className="text-[10px] font-bold text-orange-400 tracking-wider uppercase font-mono">
            FINANCIAL TERMINAL
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center justify-between border-b border-[#262626] pb-1">
            <span>TERMINAL FUNCTIONS</span>
            <Zap className="w-3 h-3 text-yellow-400" />
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-md px-3 py-2 text-xs font-bold tracking-wide transition-all duration-150 border font-mono',
                    isActive
                      ? 'bg-[#1c1c1c] text-orange-400 border-orange-500/60 shadow-sm'
                      : 'text-yellow-400/70 border-transparent hover:bg-[#141414] hover:text-yellow-400 hover:border-[#333333]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-orange-500' : 'text-yellow-500/70 group-hover:text-yellow-400'
                      )}
                    />
                    <span className="uppercase text-[11px] font-mono">{item.name}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase border',
                        item.badge === 'ALERT'
                          ? 'bg-orange-950 text-orange-400 border-orange-700'
                          : 'bg-yellow-950 text-yellow-400 border-yellow-700'
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-400 font-bold font-mono">[{item.shortcut}]</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Governance & System Config Section (Always Accessible) */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-widest text-orange-500 border-b border-[#262626] pb-1 flex items-center justify-between">
            <span>PROFILES & GOVERNANCE</span>
            <span className="text-[9px] text-yellow-400 font-mono">{user?.role || 'MGR'}</span>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors border font-mono',
                    isActive
                      ? 'bg-[#1c1c1c] text-orange-400 border-orange-500/60'
                      : 'text-yellow-400/70 border-transparent hover:bg-[#141414] hover:text-yellow-400'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-orange-500' : 'text-yellow-500/70 group-hover:text-yellow-400'
                      )}
                    />
                    <span className="text-[11px] font-mono">{item.name}</span>
                  </div>
                  {item.href === '/users' && (
                    <span className="rounded bg-orange-950 px-1.5 py-0.2 text-[9px] font-bold text-orange-400 border border-orange-700 uppercase">
                      ROLES
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#262626] p-3.5 bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1c1c1c] border border-[#333333] text-orange-400 font-mono text-xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-orange-400 truncate uppercase font-mono">
              {company?.name || 'ABC TECHNOLOGIES'}
            </p>
            <p className="text-[10px] text-yellow-400 font-bold font-mono">
              CURR: {company?.currency || 'INR'} // ONLINE
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
