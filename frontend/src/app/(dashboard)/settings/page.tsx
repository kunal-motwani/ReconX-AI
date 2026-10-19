'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, Shield, RefreshCw, Layers, Check, Zap } from 'lucide-react';
import { companyApi } from '@/services/api';
import { Company } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ERP Connectors state
  const [plaidConnected, setPlaidConnected] = useState(true);
  const [sapConnected, setSapConnected] = useState(true);
  const [quickbooksConnected, setQuickbooksConnected] = useState(false);
  const [connectingSystem, setConnectingSystem] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    country: '',
    currency: 'INR',
    fiscalYear: '2026-2027'
  });

  useEffect(() => {
    companyApi
      .get()
      .then((data) => {
        setCompany(data);
        setFormData({
          name: data.name,
          industry: data.industry,
          country: data.country,
          currency: data.currency,
          fiscalYear: data.fiscalYear
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await companyApi.update(formData);
      setCompany(updated);
      setMessage('Company settings updated successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConnector = (system: string) => {
    setConnectingSystem(system);
    setTimeout(() => {
      if (system === 'Plaid') setPlaidConnected(!plaidConnected);
      if (system === 'SAP') setSapConnected(!sapConnected);
      if (system === 'QuickBooks') setQuickbooksConnected(!quickbooksConnected);
      setConnectingSystem(null);
    }, 1000);
  };

  if (loading) return <LoadingSpinner size="lg" label="LOADING COMPANY SETTINGS..." />;

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="border-b border-[#262626] pb-5">
        <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
          SYSTEM SETTINGS & LEDGER POLICY [F9]
        </h1>
        <p className="text-xs text-yellow-400/70 mt-1 font-sans">
          Configure fiscal boundaries, default currency formatting, and live open banking ERP integrations
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-md border border-orange-500 bg-orange-950 p-4 text-xs font-bold text-orange-400 font-mono">
          <CheckCircle2 className="w-4 h-4 text-orange-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Organization Identity Form */}
      <form onSubmit={handleSubmit} className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-5 font-terminal text-xs">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">ORGANIZATION IDENTITY</span>
          <span className="text-[10px] text-yellow-400 bg-[#1c1c1c] border border-[#333333] px-2 py-0.5 rounded uppercase font-mono">
            ID: {company?.id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Company Legal Name</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Industry Sector</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Operating Country</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Ledger Currency (ISO)</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-3 font-mono">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase transition-colors"
            >
              <Save className="w-4 h-4 text-black" />
              <span>{saving ? 'SAVING...' : 'SAVE COMPANY PROFILE'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Live ERP & Open Banking Connectors */}
      <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-4 font-terminal text-xs">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3 font-mono">
          <div>
            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider block">
              OPEN BANKING & ERP GATEWAY CONNECTORS
            </span>
            <p className="text-[11px] text-yellow-400/70 font-sans">Automatic statement polling and real-time ledger synchronization</p>
          </div>
          <span className="text-[10px] text-orange-400 bg-orange-950 border border-orange-800 px-2 py-0.5 rounded font-bold uppercase">
            3 CONNECTORS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
          {/* Plaid Open Banking */}
          <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-400 text-xs uppercase">PLAID BANK FEED</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${plaidConnected ? 'bg-yellow-950 text-yellow-400 border border-yellow-700' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}>
                {plaidConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-[10px] text-yellow-400/70 font-sans">Live multi-bank statement feed API</p>
            <button
              onClick={() => handleToggleConnector('Plaid')}
              disabled={connectingSystem === 'Plaid'}
              className="w-full rounded border border-[#333333] bg-[#1c1c1c] hover:border-orange-500 p-1.5 text-center text-[10px] font-bold text-yellow-400 uppercase transition-colors"
            >
              {connectingSystem === 'Plaid' ? 'SYNCING...' : plaidConnected ? 'RECONNECT API' : 'CONNECT PLAID'}
            </button>
          </div>

          {/* SAP ERP Connector */}
          <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-400 text-xs uppercase">SAP S/4HANA</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${sapConnected ? 'bg-yellow-950 text-yellow-400 border border-yellow-700' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}>
                {sapConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-[10px] text-yellow-400/70 font-sans">Enterprise Chart of Accounts sync</p>
            <button
              onClick={() => handleToggleConnector('SAP')}
              disabled={connectingSystem === 'SAP'}
              className="w-full rounded border border-[#333333] bg-[#1c1c1c] hover:border-orange-500 p-1.5 text-center text-[10px] font-bold text-yellow-400 uppercase transition-colors"
            >
              {connectingSystem === 'SAP' ? 'SYNCING...' : sapConnected ? 'RECONNECT SAP' : 'CONNECT SAP'}
            </button>
          </div>

          {/* QuickBooks Online */}
          <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-400 text-xs uppercase">QUICKBOOKS</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${quickbooksConnected ? 'bg-yellow-950 text-yellow-400 border border-yellow-700' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}>
                {quickbooksConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-[10px] text-yellow-400/70 font-sans">SME ledger journal entry sync</p>
            <button
              onClick={() => handleToggleConnector('QuickBooks')}
              disabled={connectingSystem === 'QuickBooks'}
              className="w-full rounded border border-[#333333] bg-[#1c1c1c] hover:border-orange-500 p-1.5 text-center text-[10px] font-bold text-yellow-400 uppercase transition-colors"
            >
              {connectingSystem === 'QuickBooks' ? 'SYNCING...' : quickbooksConnected ? 'RECONNECT QB' : 'CONNECT QUICKBOOKS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
