'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SearchCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Filter
} from 'lucide-react';
import { investigationApi } from '@/services/api';
import { Investigation } from '@/types';
import { formatDate, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const data = await investigationApi.list(statusFilter || undefined);
      setInvestigations(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
              AI ROOT-CAUSE INVESTIGATIONS [F6]
            </h1>
            <span className="rounded bg-yellow-500/20 px-2.5 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-500/40 uppercase">
              AUDIT TIMELINES
            </span>
          </div>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Automated timeline reconstruction, discrepancy evidence bundling, and sign-off workflows
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 bg-[#121212] p-3 rounded-md border border-[#262626] font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === '' ? 'bg-orange-500 text-black' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            ALL INVESTIGATIONS
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === 'IN_PROGRESS' ? 'bg-orange-950 text-orange-400 border border-orange-800' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            IN PROGRESS
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === 'COMPLETED' ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            COMPLETED
          </button>
        </div>
        <span className="text-xs text-yellow-400 font-bold uppercase">
          {investigations.length} CASES ACTIVE
        </span>
      </div>

      {loading ? (
        <LoadingSpinner label="LOADING INVESTIGATION CASE FILES..." />
      ) : investigations.length === 0 ? (
        <EmptyState
          icon={SearchCheck}
          title="No investigations open"
          description="Open any anomaly in the Anomaly Center to initiate an audit investigation."
          actionLabel="View Anomalies"
          onAction={() => (window.location.href = '/anomalies')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {investigations.map((inv) => (
            <div
              key={inv.id}
              className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3 font-mono">
                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  <span className="text-sm font-extrabold text-orange-500 uppercase">
                    {inv.anomaly?.title || `CASE #${inv.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <Link
                  href={`/investigations/${inv.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-400 px-3.5 py-1.5 text-xs font-bold text-black uppercase shadow-sm"
                >
                  <span>OPEN DOSSIER & TIMELINE</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </Link>
              </div>

              <div className="space-y-1 font-mono">
                <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400/60">
                  FINDINGS
                </span>
                <p className="text-xs text-yellow-400/90 line-clamp-2 font-sans">{inv.findings}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#262626] text-xs font-mono">
                <div className="text-orange-400 font-bold truncate max-w-xl">
                  <span className="text-yellow-400/60 uppercase">RECOMMENDATION: </span>
                  {inv.recommendation}
                </div>
                <div className="text-yellow-400/50 text-[11px] flex-shrink-0 uppercase">
                  ASSIGNED: {inv.assignedTo ? `${inv.assignedTo.firstName} ${inv.assignedTo.lastName}` : 'UNASSIGNED'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
