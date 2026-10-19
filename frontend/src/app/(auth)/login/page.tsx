'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Terminal,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Zap,
  Sparkles,
  Accessibility,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDesignSystem } from '@/context/DesignSystemContext';

export default function LoginPage() {
  const [email, setEmail] = useState('manager@abctech.com');
  const [password, setPassword] = useState('Demo1234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { theme, setTheme, playSound } = useDesignSystem();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('scan');
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      playSound('success');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid terminal authorization credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickPersona = async (demoEmail: string) => {
    playSound('hotkey');
    setEmail(demoEmail);
    setPassword('Demo1234!');
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, 'Demo1234!');
      playSound('success');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authorization error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#0a0a0a] terminal-grid-bg text-yellow-400 font-terminal p-4 select-none relative">
      {/* Top Accessibility & Experience Switcher Bar */}
      <div className="fixed top-4 left-4 right-4 flex items-center justify-between max-w-6xl mx-auto z-20 font-mono text-xs">
        <Link
          href="/"
          onClick={() => playSound('click')}
          className="inline-flex items-center gap-2 rounded border border-[#333333] bg-[#121212] hover:border-orange-500 px-3 py-1.5 text-yellow-400 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>← INTERACTIVE SHOWCASE</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            setTheme(theme === 'TERMINAL_AMBER' ? 'COLORBLIND_SAFE' : 'TERMINAL_AMBER');
          }}
          className="inline-flex items-center gap-1.5 rounded border border-[#333333] bg-[#121212] hover:border-orange-500 px-3 py-1.5 text-yellow-400 uppercase"
        >
          <Accessibility className="w-3.5 h-3.5 text-orange-500" />
          <span>{theme === 'COLORBLIND_SAFE' ? 'A11Y CYAN MODE: ON' : '♿ COLORBLIND MODE'}</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1c1c1c] border border-orange-500/50 text-orange-500 shadow-2xl mb-1">
            <Terminal className="w-6 h-6 animate-pulse text-orange-500" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-950/60 border border-orange-500/40 px-3 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-widest block mx-auto">
            HYPERBLOOM OCTOBER // FINOPS TERMINAL
          </div>
          <h1 className="text-2xl font-extrabold tracking-widest text-orange-500 uppercase">
            RECONX TERMINAL
          </h1>
          <p className="text-xs text-yellow-400/80 font-sans">
            Autonomous Financial Reconciliation & Multi-Agent ML System
          </p>
        </div>

        {/* Login Box */}
        <div className="bloomberg-panel rounded-lg p-6 space-y-5 border border-[#262626] bg-[#121212] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500" />

          <div className="flex items-center justify-between border-b border-[#262626] pb-3 text-xs font-bold font-mono">
            <span className="text-orange-500 uppercase tracking-wider">SYSTEM AUTHENTICATION</span>
            <span className="text-yellow-400 bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#333333] text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-orange-400" />
              ZERO-LATENCY READY
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-950/80 p-3 rounded border border-orange-800 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-orange-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Instant Persona Launchers */}
          <div className="space-y-2 bg-[#0a0a0a] p-3.5 rounded-md border border-orange-500/40">
            <span className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-orange-400 uppercase tracking-widest text-center font-mono">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              1-CLICK INSTANT JUDGE LOGIN (AUTO-CONNECT)
            </span>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold font-mono">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOneClickPersona('admin@abctech.com')}
                className="rounded border border-[#333333] bg-[#161616] hover:bg-orange-500 hover:text-black hover:border-orange-400 p-2 text-center text-yellow-400 transition-all uppercase"
              >
                ⚡ ADMIN
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOneClickPersona('manager@abctech.com')}
                className="rounded border border-orange-500 bg-orange-500/20 hover:bg-orange-500 hover:text-black p-2 text-center text-orange-300 transition-all uppercase font-extrabold"
              >
                ⚡ MANAGER
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOneClickPersona('analyst@abctech.com')}
                className="rounded border border-[#333333] bg-[#161616] hover:bg-orange-500 hover:text-black hover:border-orange-400 p-2 text-center text-yellow-400 transition-all uppercase"
              >
                ⚡ ANALYST
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase font-mono">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-orange-400/70" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@abctech.com"
                  className="w-full rounded border border-[#262626] bg-[#0a0a0a] pl-9 pr-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase font-mono">
                Access Token / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-orange-400/70" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded border border-[#262626] bg-[#0a0a0a] pl-9 pr-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-orange-500 hover:bg-orange-400 py-2.5 text-xs font-extrabold text-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg font-mono"
            >
              <span>{loading ? 'CONNECTING TO SWARM...' : 'CONNECT TO TERMINAL'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-yellow-400/60 space-y-1 font-mono">
          <p>ReconX FinOps Platform // Autonomous Offline-Resilient Engine</p>
        </div>
      </div>
    </div>
  );
}
