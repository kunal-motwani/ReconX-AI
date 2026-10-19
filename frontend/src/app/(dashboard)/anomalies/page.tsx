'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  SearchCheck,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { anomalyApi, investigationApi } from '@/services/api';
import { Anomaly, AnomalySeverity, AnomalyStatus } from '@/types';
import { formatDate, formatCurrency } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Resolve Modal
  const [activeAnomaly, setActiveAnomaly] = useState<Anomaly | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const data = await anomalyApi.list({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined
      });
      setAnomalies(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [severityFilter, statusFilter, typeFilter]);

  const handleResolve = async () => {
    if (!activeAnomaly) return;
    setResolving(true);
    try {
      await anomalyApi.resolve(activeAnomaly.id, resolveNotes);
      setActiveAnomaly(null);
      setResolveNotes('');
      fetchAnomalies();
    } catch (err: any) {
      alert(err.message || 'Resolve failed');
    } finally {
      setResolving(false);
    }
  };

  const handleDismiss = async (id: string) => {
    const reason = prompt('Please enter reason for dismissal:');
    if (reason === null) return;
    try {
      await anomalyApi.dismiss(id, reason || 'False positive confirmed');
      fetchAnomalies();
    } catch (err: any) {
      alert(err.message || 'Dismiss failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
              ANOMALY CONTROL CENTER [F5]
            </h1>
            <span className="rounded bg-orange-950 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-800 uppercase">
              HEURISTIC AUDIT ENGINE
            </span>
          </div>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Automated detection of amount variances, duplicate disbursements, missing vouchers, and policy limits
          </p>
        </div>

        <Link
          href="/investigations"
          className="inline-flex items-center gap-2 rounded-md bg-[#1c1c1c] border border-[#333333] hover:bg-[#242424] px-4 py-2 text-xs font-bold text-yellow-400 transition-colors uppercase font-mono"
        >
          <SearchCheck className="w-4 h-4 text-orange-400" />
          <span>VIEW INVESTIGATION DOSSIERS [F6]</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121212] p-3 rounded-md border border-[#262626] font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="">ALL STATUSES</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="">ALL ANOMALY TYPES</option>
            <option value="AMOUNT_MISMATCH">AMOUNT MISMATCH</option>
            <option value="DUPLICATE_PAYMENT">DUPLICATE PAYMENT</option>
            <option value="UNUSUAL_AMOUNT">UNUSUAL AMOUNT OUTLIER</option>
            <option value="MISSING_INVOICE">MISSING SUPPORTING INVOICE</option>
          </select>
        </div>

        <span className="text-xs text-yellow-400 font-bold uppercase">
          SHOWING {anomalies.length} ANOMALIES
        </span>
      </div>

      {/* Anomalies List */}
      {loading ? (
        <LoadingSpinner label="AUDITING LEDGER ANOMALIES..." />
      ) : anomalies.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No anomalies detected"
          description="All ledger transactions and reconciliations conform to standard financial rules."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3 font-mono">
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={anom.severity} />
                  <span className="text-sm font-bold text-orange-500 uppercase">{anom.title}</span>
                  <StatusBadge status={anom.status} />
                </div>

                <div className="flex items-center gap-2">
                  {anom.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        setActiveAnomaly(anom);
                        setResolveNotes('');
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-orange-500 hover:bg-orange-400 px-3 py-1 text-xs font-bold text-black uppercase shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                      <span>RESOLVE</span>
                    </button>
                  )}
                  {anom.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleDismiss(anom.id)}
                      className="rounded-md border border-[#333333] bg-[#0a0a0a] px-2.5 py-1 text-xs font-bold text-yellow-400 hover:border-orange-500 uppercase"
                    >
                      DISMISS
                    </button>
                  )}
                  <Link
                    href={`/anomalies/${anom.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-orange-950 border border-orange-800 px-3 py-1 text-xs font-bold text-orange-400 uppercase hover:bg-orange-900"
                  >
                    <span>INVESTIGATE</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <p className="text-xs text-yellow-400/80 leading-relaxed font-sans">{anom.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs border-t border-[#262626] font-mono">
                <div className="text-orange-400 font-bold">
                  <span className="text-yellow-400/60 uppercase">RECOMMENDED ACTION: </span>
                  {anom.recommendedAction || 'Cross-verify invoice documentation before payment.'}
                </div>
                <span className="text-yellow-400/50 text-[11px] uppercase">DETECTED {formatDate(anom.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      <Modal
        isOpen={!!activeAnomaly}
        onClose={() => setActiveAnomaly(null)}
        title="Resolve Anomaly"
        subtitle={`Closing case #${activeAnomaly?.id.substring(0, 8).toUpperCase()}`}
      >
        <div className="space-y-4 font-terminal text-xs">
          <p className="text-xs text-yellow-400/80">{activeAnomaly?.title}</p>
          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Resolution Audit Notes</label>
            <textarea
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="e.g., Verified TDS certificate with vendor finance desk; variance adjusted in general ledger."
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 h-24 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 font-mono">
            <button
              onClick={() => setActiveAnomaly(null)}
              className="rounded-md border border-[#262626] px-3.5 py-1.5 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-1.5 text-xs font-bold text-black uppercase"
            >
              {resolving ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
