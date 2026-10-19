'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, AlertCircle, Terminal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-yellow-400 font-terminal px-4 py-8 select-none">
      <div className="w-full max-w-lg space-y-6 rounded-md border border-[#262626] bg-[#121212] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#1c1c1c] border border-[#333333] text-orange-500 shadow-lg mb-2">
            <Terminal className="w-6 h-6 text-orange-500 animate-pulse" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-widest text-orange-500 uppercase">CREATE ORGANIZATION</h2>
          <p className="mt-1 text-xs text-yellow-400/80 font-sans">
            Setup your company ledger and autonomous reconciliation workspace
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded border border-orange-800 bg-orange-950/80 p-3 text-xs text-orange-400 font-mono">
            <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:border-orange-500 focus:outline-none"
                placeholder="Rajesh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:border-orange-500 focus:outline-none"
                placeholder="Sharma"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Company / Organization Name</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:border-orange-500 focus:outline-none"
              placeholder="Acme Financial Corp"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Work Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:border-orange-500 focus:outline-none"
              placeholder="admin@acme.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Master Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:border-orange-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded bg-orange-500 hover:bg-orange-400 py-2.5 text-xs font-extrabold text-black uppercase tracking-wider disabled:opacity-50 transition-colors mt-6 font-mono shadow-lg"
          >
            {loading ? 'CREATING ORGANIZATION...' : 'COMPLETE REGISTRATION'}
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </form>

        <div className="text-center text-xs text-yellow-400/80 font-mono">
          Already have an organization?{' '}
          <Link href="/login" className="font-bold text-orange-400 hover:underline uppercase">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
