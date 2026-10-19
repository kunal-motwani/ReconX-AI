'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Zap,
  UserCheck,
  KeyRound,
  Sparkles,
  Building2,
} from 'lucide-react';
import { userApi } from '@/services/api';
import { User, UserRole } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useDesignSystem } from '@/context/DesignSystemContext';

const ROLE_CLEARANCE_INFO: Record<
  UserRole,
  { badge: string; title: string; clearance: string; capabilities: string[] }
> = {
  ADMIN: {
    badge: 'LEVEL 5 · ROOT ADMIN',
    title: 'Chief Systems & FinOps Administrator',
    clearance: 'FULL SYSTEM GOVERNANCE & SOX POLICY OVERRIDE',
    capabilities: [
      'Provision & Modify Operator Profiles (/users)',
      'Configure SOX 404 Matching Thresholds (/settings)',
      'Full Sign-off & Override on All Reconciliations [F4/F7]',
      'Cryptographic SHA-256 Audit Ledger Verification [F10]',
    ],
  },
  FINANCE_MANAGER: {
    badge: 'LEVEL 4 · CONTROLLER',
    title: 'Enterprise Finance Controller & Approver',
    clearance: 'RECONCILIATION SIGN-OFF & EXCEPTION APPROVALS',
    capabilities: [
      'Approve / Reject High-Value Variances in Human Queue [F7]',
      'Execute 6-Agent Autonomous Reconciliation Runs [F4]',
      'Resolve or Dismiss Section 194Q & Duplicate Alerts [F5]',
      'Export Statutory CSV & SOX 404 Compliance Reports [F9]',
    ],
  },
  FINANCE_ANALYST: {
    badge: 'LEVEL 3 · ANALYST',
    title: 'FinOps Reconciliation & Forensic Analyst',
    clearance: 'DOCUMENT INGESTION, RAG INVESTIGATION & LEDGER OPS',
    capabilities: [
      'Upload Invoices, Bank CSVs & Custom Datasets [F2]',
      'Inspect X-Ray Laser Diff & 5-Factor Vector Radar [F4]',
      'Open AI Root-Cause RAG Investigations [F6]',
      'Map General Ledger Cost Centers [F8]',
    ],
  },
};

export default function UsersPage() {
  const searchParams = useSearchParams();
  const { user: currentUser, company, switchProfile } = useAuth();
  const { playSound } = useDesignSystem();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Add User / Create Profile Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoSwitchOnCreate, setAutoSwitchOnCreate] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'ADMIN' as UserRole,
    password: 'Demo1234!',
  });

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.list();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSwitchToUser = (target: User) => {
    playSound('success');
    switchProfile(target);
    setBannerNotice(
      `✓ ACTIVE TERMINAL SESSION SWITCHED TO: ${target.firstName.toUpperCase()} ${target.lastName.toUpperCase()} [${target.role}]`
    );
    setTimeout(() => setBannerNotice(null), 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('scan');
    try {
      const created = await userApi.create(formData);
      playSound('success');
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'ADMIN',
        password: 'Demo1234!',
      });
      await fetchUsers();
      if (autoSwitchOnCreate && created) {
        switchProfile(created);
        setBannerNotice(
          `✓ CREATED & ACTIVATED NEW PROFILE: ${created.firstName.toUpperCase()} ${created.lastName.toUpperCase()} [${created.role}]`
        );
      } else if (created) {
        setBannerNotice(
          `✓ PROVISIONED NEW OPERATOR PROFILE: ${created.firstName.toUpperCase()} ${created.lastName.toUpperCase()} [${created.role}]`
        );
      }
      setTimeout(() => setBannerNotice(null), 6000);
    } catch (err: any) {
      alert(err.message || 'User creation failed');
    }
  };

  const handleToggleRole = async (userId: string, newRole: UserRole) => {
    playSound('click');
    try {
      const updated = await userApi.update(userId, { role: newRole });
      await fetchUsers();
      if (currentUser?.id === userId && updated) {
        switchProfile({ ...currentUser, role: newRole });
      }
      setBannerNotice(`✓ UPDATED ROLE PERMISSION TO [${newRole}]`);
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Role update failed');
    }
  };

  const activeRoleMeta =
    ROLE_CLEARANCE_INFO[currentUser?.role || 'FINANCE_MANAGER'] ||
    ROLE_CLEARANCE_INFO.FINANCE_MANAGER;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-14 text-yellow-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded bg-orange-950/60 border border-orange-500/40 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 uppercase mb-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            <span>RBAC OPERATOR PROFILES & IDENTITY GOVERNANCE</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
            OPERATOR PROFILES, ADMIN SWITCHER & ROLE CONTROL
          </h1>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Switch instantaneously between Admin, Finance Manager, and Finance Analyst profiles—or create a brand-new custom operator profile in one click.
          </p>
        </div>

        <button
          onClick={() => {
            playSound('click');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2.5 text-xs font-extrabold text-black uppercase shadow-lg transition-colors font-mono"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>+ CREATE NEW PROFILE / ADMIN</span>
        </button>
      </div>

      {/* Live Status Toast */}
      {bannerNotice && (
        <div className="rounded-md border border-orange-500 bg-orange-950/70 px-4 py-3 flex items-center justify-between text-xs font-mono text-yellow-400 shadow-lg">
          <div className="flex items-center gap-2.5 font-extrabold">
            <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <span className="text-[10px] text-orange-400 uppercase">RBAC SESSION UPDATED</span>
        </div>
      )}

      {/* Active Session Profile Dossier + 1-Click Role Switcher Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active Operator Dossier */}
        <div className="lg:col-span-5 rounded-md border border-orange-500/60 bg-[#121212] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
              <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                CURRENT ACTIVE OPERATOR PROFILE
              </span>
              <span className="rounded bg-orange-500 px-2 py-0.5 text-[9px] font-extrabold text-black uppercase font-mono">
                {activeRoleMeta.badge}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-md bg-[#1c1c1c] border-2 border-orange-500 flex items-center justify-center text-xl font-extrabold text-orange-400 font-mono shadow-md">
                {currentUser?.firstName?.[0] || 'P'}
                {currentUser?.lastName?.[0] || 'N'}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-yellow-400 uppercase tracking-wide font-mono">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h2>
                <p className="text-xs text-orange-400 font-mono">{currentUser?.email}</p>
                <p className="text-[10px] text-yellow-400/70 uppercase font-mono mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-orange-500" />
                  {company?.name || 'ABC Technologies Pvt Ltd'}
                </p>
              </div>
            </div>

            <div className="rounded border border-[#262626] bg-[#0a0a0a] p-3 space-y-2 font-mono">
              <div className="text-[10px] font-extrabold text-orange-400 uppercase">
                CLEARANCE: {activeRoleMeta.clearance}
              </div>
              <ul className="space-y-1 text-[11px] text-yellow-400/80">
                {activeRoleMeta.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-yellow-400/70">
            <span>SESSION TOKEN: reconx-jwt-sim-{currentUser?.id}</span>
            <span className="text-orange-400 font-bold uppercase">ONLINE // VERIFIED</span>
          </div>
        </div>

        {/* Right: 1-Click Quick-Switch Persona Cards (Admin / Manager / Analyst) */}
        <div className="lg:col-span-7 rounded-md border border-[#262626] bg-[#121212] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
              <div>
                <span className="text-xs font-extrabold text-orange-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-500" />
                  1-CLICK INSTANT PROFILE SWITCHER
                </span>
                <p className="text-[11px] text-yellow-400/70 font-sans mt-0.5">
                  Click any profile below to switch your active terminal session immediately—no password or re-login required.
                </p>
              </div>
              <button
                onClick={() => {
                  playSound('click');
                  setIsModalOpen(true);
                }}
                className="rounded border border-orange-500/60 bg-orange-950/40 hover:bg-orange-500 hover:text-black px-2.5 py-1 text-[10px] font-extrabold text-orange-400 uppercase transition-colors font-mono"
              >
                + NEW CUSTOM PROFILE
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              {users.slice(0, 6).map((u) => {
                const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email;
                return (
                  <div
                    key={u.id}
                    className={`rounded-md border p-3.5 flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-950/30 shadow-md'
                        : 'border-[#262626] bg-[#0a0a0a] hover:border-orange-500/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded bg-[#1c1c1c] border border-[#333333] px-1.5 py-0.5 text-[9px] font-extrabold text-orange-400 uppercase">
                          {u.role.replace('_', ' ')}
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[8px] font-extrabold text-black uppercase">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-extrabold text-yellow-400 uppercase">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] text-yellow-400/60 truncate mt-0.5">{u.email}</p>
                    </div>

                    <button
                      onClick={() => handleSwitchToUser(u)}
                      disabled={isCurrent}
                      className={`mt-3 w-full rounded py-1.5 text-[10px] font-extrabold uppercase transition-all ${
                        isCurrent
                          ? 'bg-[#1c1c1c] text-orange-400 border border-orange-500/40 cursor-default'
                          : 'bg-orange-500 hover:bg-orange-400 text-black shadow'
                      }`}
                    >
                      {isCurrent ? '✓ CURRENT PROFILE' : `SWITCH TO ${u.firstName.toUpperCase()}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-yellow-400/70">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              NEED A CUSTOM ADMIN OR AUDITOR PROFILE? CLICK &ldquo;+ CREATE NEW PROFILE / ADMIN&rdquo; ABOVE.
            </span>
          </div>
        </div>
      </div>

      {/* Full Directory & Role Assignment Table */}
      {loading ? (
        <LoadingSpinner label="LOADING ORGANIZATION PROFILES..." />
      ) : (
        <div className="bloomberg-panel rounded-md overflow-hidden border border-[#262626] bg-[#121212]">
          <div className="px-5 py-3.5 border-b border-[#262626] bg-[#0a0a0a] flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">
                ALL PROVISIONED ORGANIZATION PROFILES ({users.length})
              </span>
            </div>
            <span className="text-[10px] text-yellow-400/70 uppercase">
              INSTANT RBAC ROLE ELEVATION & SESSION SWITCHING
            </span>
          </div>

          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-[#262626] bg-[#0a0a0a] text-orange-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3">OPERATOR NAME</th>
                <th className="px-4 py-3">EMAIL ADDRESS</th>
                <th className="px-4 py-3">CLEARANCE ROLE</th>
                <th className="px-4 py-3 text-center">SESSION STATUS</th>
                <th className="px-4 py-3">CHANGE ROLE</th>
                <th className="px-5 py-3 text-right">INSTANT PROFILE SWITCH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] text-yellow-400">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email;
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-orange-950/20' : 'hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-bold text-yellow-400 uppercase flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded bg-[#1c1c1c] border border-[#333333] flex items-center justify-center text-[11px] font-extrabold text-orange-400">
                        {u.firstName?.[0] || 'U'}
                      </span>
                      <div>
                        <div>
                          {u.firstName} {u.lastName}
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] text-orange-400 font-extrabold">
                            ● CURRENTLY SIGNED IN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-orange-400 font-mono text-[11px]">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-[#1c1c1c] border border-[#333333] px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`rounded px-2.5 py-0.5 text-[10px] font-bold border uppercase ${
                          isCurrent
                            ? 'bg-orange-500 text-black border-orange-400'
                            : 'bg-yellow-950 text-yellow-400 border-yellow-700'
                        }`}
                      >
                        {isCurrent ? 'ACTIVE SESSION' : 'READY'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleToggleRole(u.id, e.target.value as UserRole)}
                        className="rounded-md border border-[#262626] bg-[#0a0a0a] px-2 py-1 text-[11px] text-yellow-400 focus:outline-none focus:border-orange-500 font-mono uppercase"
                      >
                        <option value="ADMIN">ADMIN (ROOT)</option>
                        <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                        <option value="FINANCE_ANALYST">FINANCE_ANALYST</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleSwitchToUser(u)}
                        disabled={isCurrent}
                        className={`rounded px-3 py-1.5 text-[10px] font-extrabold uppercase transition-all ${
                          isCurrent
                            ? 'bg-[#1c1c1c] text-yellow-400/50 border border-[#333333] cursor-default'
                            : 'bg-orange-500 hover:bg-orange-400 text-black shadow'
                        }`}
                      >
                        {isCurrent ? 'ACTIVE NOW' : 'SWITCH PROFILE →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create New Profile / Admin Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Operator / Admin Profile"
        subtitle="Provision a new Admin, Finance Manager, or Finance Analyst profile and optionally switch into it immediately"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-terminal text-xs">
          {/* Quick Preset Role Templates */}
          <div className="rounded border border-[#262626] bg-[#0a0a0a] p-3 space-y-2">
            <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider block font-mono">
              ⚡ QUICK-FILL PROFILE TEMPLATES (OPTIONAL)
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    firstName: 'Vikram',
                    lastName: 'Desai',
                    email: 'vikram.admin@abctech.com',
                    role: 'ADMIN',
                    password: 'Demo1234!',
                  })
                }
                className="rounded border border-[#333333] bg-[#141414] hover:border-orange-500 px-2 py-1.5 text-[10px] font-bold text-yellow-400 uppercase"
              >
                + Chief Admin
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    firstName: 'Ananya',
                    lastName: 'Iyer',
                    email: 'ananya.vp@abctech.com',
                    role: 'FINANCE_MANAGER',
                    password: 'Demo1234!',
                  })
                }
                className="rounded border border-[#333333] bg-[#141414] hover:border-orange-500 px-2 py-1.5 text-[10px] font-bold text-yellow-400 uppercase"
              >
                + VP Controller
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    firstName: 'Rohan',
                    lastName: 'Kapoor',
                    email: 'rohan.audit@abctech.com',
                    role: 'FINANCE_ANALYST',
                    password: 'Demo1234!',
                  })
                }
                className="rounded border border-[#333333] bg-[#141414] hover:border-orange-500 px-2 py-1.5 text-[10px] font-bold text-yellow-400 uppercase"
              >
                + SOX Auditor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase font-mono">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="e.g. Vikram"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase font-mono">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="e.g. Desai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase font-mono">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
              placeholder="vikram.admin@abctech.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase font-mono">
              Clearance Role Permission
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono uppercase"
            >
              <option value="ADMIN">ADMIN (FULL ROOT CONTROL, USER & POLICY GOVERNANCE)</option>
              <option value="FINANCE_MANAGER">FINANCE MANAGER (APPROVALS & RECONCILIATION SIGN-OFF)</option>
              <option value="FINANCE_ANALYST">FINANCE ANALYST (OCR INGESTION & RAG INVESTIGATIONS)</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 rounded border border-orange-500/40 bg-orange-950/20 p-3 cursor-pointer font-mono">
            <input
              type="checkbox"
              checked={autoSwitchOnCreate}
              onChange={(e) => setAutoSwitchOnCreate(e.target.checked)}
              className="rounded border-orange-500 bg-[#0a0a0a] text-orange-500 focus:ring-0"
            />
            <span className="text-[11px] font-bold text-yellow-400 uppercase">
              Switch active terminal session to this new profile immediately upon creation
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 font-mono">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md border border-[#262626] px-3.5 py-2 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-extrabold text-black uppercase shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>{autoSwitchOnCreate ? 'Create & Switch to Profile' : 'Create Profile'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
