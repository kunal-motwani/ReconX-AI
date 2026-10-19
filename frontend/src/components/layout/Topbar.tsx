'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Zap,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Type,
  Accessibility,
  Users,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';
import { useDesignSystem, VisualTheme } from '@/context/DesignSystemContext';
import { reconciliationApi, userApi } from '@/services/api';
import { User } from '@/types';

export const Topbar: React.FC = () => {
  const { user, logout, switchProfile } = useAuth();
  const {
    theme,
    setTheme,
    dyslexiaMode,
    setDyslexiaMode,
    soundEnabled,
    setSoundEnabled,
    setIsCommandPaletteOpen,
    setIsUxTourOpen,
    playSound,
  } = useDesignSystem();

  const [isRunningRecon, setIsRunningRecon] = useState(false);
  const [reconNotice, setReconNotice] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const router = useRouter();

  const handleOpenProfileMenu = async () => {
    playSound('click');
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);
    if (nextState) {
      try {
        const list = await userApi.list();
        setAvailableUsers(list);
      } catch (e) {}
    }
  };

  const handleRunRecon = async () => {
    playSound('scan');
    setIsRunningRecon(true);
    setReconNotice(null);
    try {
      const result = await reconciliationApi.run();
      playSound('success');
      setReconNotice(
        `MATCHED: ${result.matchedCount} // MISMATCH: ${result.mismatchCount}`
      );
      setTimeout(() => setReconNotice(null), 6000);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to execute agent reconciliation');
    } finally {
      setIsRunningRecon(false);
    }
  };

  const cycleTheme = () => {
    playSound('click');
    const order: VisualTheme[] = ['TERMINAL_AMBER', 'COLORBLIND_SAFE', 'SWISS_PAPER'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const themeBadgeLabel =
    theme === 'TERMINAL_AMBER'
      ? 'AMBER OLED'
      : theme === 'COLORBLIND_SAFE'
      ? 'A11Y CYAN'
      : 'SWISS PAPER';

  return (
    <header className="h-16 border-b border-[#262626] bg-[#121212] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none font-terminal">
      {/* Left Minimal Ticker Feed + Omni-Command Trigger */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2.5 bg-[#0a0a0a] border border-[#262626] rounded-md px-3 py-1.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
            </span>
            <span className="font-bold tracking-wider text-orange-500 uppercase">RECONX SWARM</span>
          </div>
          <span className="text-neutral-700">|</span>
          <span className="text-yellow-400 font-bold font-mono text-[11px]">12ms</span>
          <span className="text-neutral-700 hidden xl:inline">|</span>
          <span className="text-orange-400 font-bold font-mono text-[11px] hidden xl:inline">
            98.5% VECTOR ACC
          </span>
        </div>

        {/* Ctrl+K Omni-Command Search Bar */}
        <button
          onClick={() => {
            playSound('hotkey');
            setIsCommandPaletteOpen(true);
          }}
          className="flex items-center gap-2 rounded-md border border-[#333333] bg-[#0a0a0a] hover:border-orange-500 px-3 py-1.5 text-xs font-mono text-yellow-400/80 hover:text-yellow-400 transition-all"
          title="Open Omni-Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-orange-500" />
          <span className="hidden md:inline text-[11px]">COMMAND / SEARCH...</span>
          <kbd className="rounded bg-[#1c1c1c] border border-[#333333] px-1.5 py-0.5 text-[9px] font-bold text-orange-400">
            ⌘K
          </kbd>
        </button>

        {reconNotice && (
          <div className="hidden lg:flex items-center gap-2 rounded-md border border-orange-500 bg-orange-950 px-3 py-1.5 text-xs text-orange-400 font-bold font-mono animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <span>{reconNotice}</span>
          </div>
        )}
      </div>

      {/* Right Action Controls & Accessibility Dock */}
      <div className="flex items-center gap-2 font-mono">
        {/* Guided UX Tour Button for HyperBloom Judges */}
        <button
          onClick={() => {
            playSound('click');
            setIsUxTourOpen(true);
          }}
          className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-orange-500/60 bg-orange-950/50 hover:bg-orange-900/60 px-2.5 py-1.5 text-[11px] font-bold text-orange-400 uppercase transition-colors"
          title="Launch HyperBloom UX & Architecture Tour"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>UX TOUR</span>
        </button>

        {/* Accessibility & Ergonomics Dropdown (♿) */}
        <div className="relative">
          <button
            onClick={() => {
              playSound('click');
              setIsA11yOpen(!isA11yOpen);
            }}
            aria-label="Accessibility and Visual Ergonomics Menu"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#333333] bg-[#0a0a0a] hover:border-yellow-400 px-2.5 py-1.5 text-[11px] font-bold text-yellow-400 uppercase transition-colors"
            title="Inclusive Accessibility & Visual Ergonomics"
          >
            <Accessibility className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden lg:inline">{themeBadgeLabel}</span>
          </button>

          {isA11yOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-md border border-orange-500/60 bg-[#121212] p-3 shadow-2xl z-50 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider">
                  ♿ INCLUSIVE ERGONOMICS HUD
                </span>
                <button
                  onClick={() => setIsA11yOpen(false)}
                  className="text-[10px] text-yellow-400/60 hover:text-orange-400"
                >
                  CLOSE
                </button>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-yellow-400/70 block uppercase">1. VISUAL SPECTRUM MODE</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => {
                      playSound('click');
                      setTheme('TERMINAL_AMBER');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] font-bold flex items-center justify-between ${
                      theme === 'TERMINAL_AMBER'
                        ? 'bg-orange-500 text-black border-orange-400'
                        : 'bg-[#0a0a0a] text-yellow-400 border-[#262626]'
                    }`}
                  >
                    <span>BLOOMBERG AMBER (OLED)</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setTheme('COLORBLIND_SAFE');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] font-bold flex items-center justify-between ${
                      theme === 'COLORBLIND_SAFE'
                        ? 'bg-orange-500 text-black border-orange-400'
                        : 'bg-[#0a0a0a] text-yellow-400 border-[#262626]'
                    }`}
                  >
                    <span>DEUTERANOPIA SAFE (CYAN)</span>
                    <Accessibility className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setTheme('SWISS_PAPER');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] font-bold flex items-center justify-between ${
                      theme === 'SWISS_PAPER'
                        ? 'bg-orange-500 text-black border-orange-400'
                        : 'bg-[#0a0a0a] text-yellow-400 border-[#262626]'
                    }`}
                  >
                    <span>SWISS DAYLIGHT PAPER</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dyslexia & Acoustic Toggles */}
              <div className="space-y-1.5 pt-2 border-t border-[#262626]">
                <button
                  onClick={() => {
                    playSound('click');
                    setDyslexiaMode(!dyslexiaMode);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#262626] hover:border-orange-500 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                    <Type className="w-3.5 h-3.5 text-orange-400" />
                    DYSLEXIA HYPERLEGIBLE
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                      dyslexiaMode ? 'bg-orange-500 text-black' : 'bg-[#1c1c1c] text-yellow-400/60'
                    }`}
                  >
                    {dyslexiaMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#262626] hover:border-orange-500 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-yellow-400/50" />
                    )}
                    TACTILE AUDIO FEEDBACK
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                      soundEnabled ? 'bg-orange-500 text-black' : 'bg-[#1c1c1c] text-yellow-400/60'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (!soundEnabled) setSoundEnabled(true);
                    playSound('success');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-orange-950/60 border border-orange-500/60 hover:bg-orange-500 hover:text-black text-[10px] font-extrabold text-orange-400 uppercase transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>🔊 TEST HARMONIC CHIME</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleRunRecon}
          disabled={isRunningRecon}
          className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-400 px-3.5 py-1.5 text-xs font-extrabold text-black shadow-md disabled:opacity-50 transition-all uppercase tracking-wider font-mono"
        >
          <Zap className={cn('w-3.5 h-3.5 fill-current text-black', isRunningRecon && 'animate-spin')} />
          <span className="hidden sm:inline">{isRunningRecon ? 'MATCHING...' : 'RUN MATCH [F4]'}</span>
        </button>

        <Link
          href="/documents?action=upload"
          onClick={() => playSound('click')}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-yellow-500/50 bg-[#1c1c1c] hover:bg-[#242424] px-3 py-1.5 text-xs font-bold text-yellow-400 uppercase tracking-wider transition-colors font-mono"
        >
          <Upload className="w-3.5 h-3.5 text-yellow-400" />
          <span>UPLOAD [F2]</span>
        </Link>

        {/* User Profile & Instant Role/Profile Switcher */}
        <div className="relative">
          <button
            onClick={handleOpenProfileMenu}
            className="flex items-center gap-2.5 pl-2.5 border-l border-[#262626] hover:opacity-90 transition-opacity"
            title="Switch Profile (Admin / Manager / Analyst) or Create New Profile"
          >
            <div className="h-8 w-8 rounded bg-[#1c1c1c] border border-orange-500/60 flex items-center justify-center text-xs font-extrabold text-orange-400 font-mono">
              {user?.firstName?.[0] || 'P'}
            </div>
            <div className="text-left hidden xl:block font-mono">
              <p className="text-xs font-bold text-yellow-400 uppercase">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-widest border bg-orange-950 text-orange-400 border-orange-800">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-yellow-400/60" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-orange-500/60 bg-[#121212] p-3 shadow-2xl z-50 font-mono space-y-2.5">
              {/* Active Session Header */}
              <div className="rounded border border-[#262626] bg-[#0a0a0a] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">
                    ACTIVE TERMINAL PROFILE
                  </span>
                  <span className="rounded bg-orange-500 px-1.5 py-0.2 text-[9px] font-extrabold text-black uppercase">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-yellow-400 uppercase mt-1">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-yellow-400/70">{user?.email}</p>
              </div>

              {/* 1-Click Instant Profile Switcher */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-orange-400 uppercase tracking-wider block px-1">
                  ⚡ 1-CLICK SWITCH PROFILE / ROLE
                </span>
                <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
                  {(availableUsers.length > 0
                    ? availableUsers
                    : [
                        {
                          id: 'usr-admin-01',
                          companyId: 'cmp-abctech-01',
                          email: 'admin@abctech.com',
                          firstName: 'Rajesh',
                          lastName: 'Sharma',
                          role: 'ADMIN' as const,
                          active: true,
                          createdAt: '',
                        },
                        {
                          id: 'usr-mgr-02',
                          companyId: 'cmp-abctech-01',
                          email: 'manager@abctech.com',
                          firstName: 'Priya',
                          lastName: 'Nair',
                          role: 'FINANCE_MANAGER' as const,
                          active: true,
                          createdAt: '',
                        },
                        {
                          id: 'usr-ana-03',
                          companyId: 'cmp-abctech-01',
                          email: 'analyst@abctech.com',
                          firstName: 'Aarav',
                          lastName: 'Mehta',
                          role: 'FINANCE_ANALYST' as const,
                          active: true,
                          createdAt: '',
                        },
                      ]
                  ).map((u) => {
                    const isCurrent = user?.id === u.id || user?.email === u.email;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          playSound('success');
                          switchProfile(u);
                          setIsMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between rounded px-2.5 py-1.5 text-left text-[11px] border transition-all',
                          isCurrent
                            ? 'bg-orange-950/60 border-orange-500 text-yellow-400 font-extrabold'
                            : 'bg-[#0a0a0a] border-[#262626] hover:border-orange-500/60 text-yellow-400/80'
                        )}
                      >
                        <div>
                          <div className="font-bold uppercase text-yellow-400">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[9px] text-orange-400 uppercase">
                            {u.role.replace('_', ' ')} · {u.email}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase',
                            isCurrent
                              ? 'bg-orange-500 text-black'
                              : 'bg-[#1c1c1c] text-orange-400 border border-[#333333]'
                          )}
                        >
                          {isCurrent ? 'ACTIVE' : 'SWITCH'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Create New Profile & Manage Directory */}
              <div className="pt-2 border-t border-[#262626] space-y-1.5">
                <Link
                  href="/users?action=create"
                  onClick={() => {
                    playSound('click');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded bg-orange-500 hover:bg-orange-400 px-3 py-2 text-[11px] font-extrabold text-black uppercase transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>+ CREATE NEW PROFILE / ADMIN</span>
                </Link>

                <Link
                  href="/users"
                  onClick={() => {
                    playSound('click');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded border border-[#333333] bg-[#0a0a0a] hover:border-orange-500 px-3 py-1.5 text-[11px] font-bold text-yellow-400 transition-colors uppercase"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-400" />
                    PROFILE & ROLE DIRECTORY
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                </Link>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded border border-[#262626] bg-[#0a0a0a] px-2.5 py-1.5 text-[10px] font-bold text-yellow-400 hover:bg-[#1c1c1c] transition-colors uppercase"
                  >
                    <Sparkles className="w-3 h-3 text-orange-400" />
                    Showcase
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded border border-orange-900/50 bg-orange-950/30 px-2.5 py-1.5 text-[10px] font-bold text-orange-400 hover:bg-orange-950/70 transition-colors uppercase"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
