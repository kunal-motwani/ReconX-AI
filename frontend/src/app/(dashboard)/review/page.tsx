'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  SearchCheck,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import { reviewApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function HumanReviewPage() {
  const [queue, setQueue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'anomalies' | 'reconciliations' | 'transactions'>('anomalies');

  // Confirmation Modal
  const [activeItem, setActiveItem] = useState<{ type: string; id: string; title: string; action: string } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await reviewApi.getQueue();
      setQueue(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenDecision = (type: string, id: string, title: string, action: string) => {
    setActiveItem({ type, id, title, action });
    setDecisionNotes('');
  };

  const handleConfirmDecision = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await reviewApi.submitDecision({
        itemType: activeItem.type,
        itemId: activeItem.id,
        action: activeItem.action,
        notes: decisionNotes
      });
      setActiveItem(null);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Review decision failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" label="LOADING HUMAN REVIEW QUEUE..." />;

  const anomalies = queue?.anomalies || [];
  const recons = queue?.pendingReconciliations || [];
  const txs = queue?.unverifiedTransactions || [];
  const summary = queue?.summary || { totalPending: 0, criticalAnomalies: 0, amountMismatches: 0 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
              HUMAN APPROVALS QUEUE [F7]
            </h1>
            <span className="rounded bg-orange-950 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-800 uppercase">
              OPERATIONS QUEUE
            </span>
          </div>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Prioritized exception queue requiring authorized finance sign-off, amount approvals, and investigation audits
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="text-xs text-yellow-400 font-bold uppercase">
            PENDING ITEMS: <span className="text-orange-500 font-extrabold">{summary.totalPending}</span>
          </span>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
          <span className="text-[11px] font-bold uppercase text-yellow-400/60">CRITICAL ANOMALIES</span>
          <div className="text-xl font-extrabold text-orange-500 mt-1">{summary.criticalAnomalies}</div>
        </div>
        <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
          <span className="text-[11px] font-bold uppercase text-yellow-400/60">AMOUNT MISMATCHES</span>
          <div className="text-xl font-extrabold text-yellow-400 mt-1">{summary.amountMismatches}</div>
        </div>
        <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
          <span className="text-[11px] font-bold uppercase text-yellow-400/60">UNVERIFIED LEDGER ENTRIES</span>
          <div className="text-xl font-extrabold text-orange-400 mt-1">{txs.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-xs font-mono">
        <button
          onClick={() => setSelectedTab('anomalies')}
          className={`px-4 py-2 rounded-md font-bold uppercase transition-colors ${
            selectedTab === 'anomalies'
              ? 'bg-orange-500 text-black'
              : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
          }`}
        >
          ANOMALIES ({anomalies.length})
        </button>
        <button
          onClick={() => setSelectedTab('reconciliations')}
          className={`px-4 py-2 rounded-md font-bold uppercase transition-colors ${
            selectedTab === 'reconciliations'
              ? 'bg-orange-500 text-black'
              : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
          }`}
        >
          RECONCILIATIONS ({recons.length})
        </button>
        <button
          onClick={() => setSelectedTab('transactions')}
          className={`px-4 py-2 rounded-md font-bold uppercase transition-colors ${
            selectedTab === 'transactions'
              ? 'bg-orange-500 text-black'
              : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
          }`}
        >
          FLAGGED LEDGER ENTRIES ({txs.length})
        </button>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'anomalies' && (
        <div className="space-y-3 font-mono">
          {anomalies.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Review queue empty"
              description="No unresolved anomalies currently in the review pipeline."
            />
          ) : (
            anomalies.map((anom: any) => (
              <div
                key={anom.id}
                className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={anom.severity} />
                    <span className="text-sm font-bold text-orange-500 uppercase">{anom.title}</span>
                  </div>
                  <p className="text-xs text-yellow-400/80 font-sans">{anom.description}</p>
                  <p className="text-[11px] text-orange-400 font-bold uppercase">
                    RECOMMENDED ACTION: {anom.recommendedAction || 'Review invoice before sign-off'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenDecision('ANOMALY', anom.id, anom.title, 'RESOLVE')}
                    className="rounded-md bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-bold text-black uppercase shadow-sm"
                  >
                    APPROVE & RESOLVE
                  </button>
                  <button
                    onClick={() => handleOpenDecision('ANOMALY', anom.id, anom.title, 'DISMISS')}
                    className="rounded-md border border-[#333333] bg-[#0a0a0a] px-3 py-1.5 text-xs font-bold text-yellow-400 hover:border-orange-500 uppercase"
                  >
                    DISMISS
                  </button>
                  <Link
                    href={`/anomalies/${anom.id}`}
                    className="rounded-md bg-orange-950 border border-orange-800 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-900 uppercase"
                  >
                    INVESTIGATE →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'reconciliations' && (
        <div className="space-y-3 font-mono">
          {recons.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No pending reconciliations"
              description="All matched pairs have been settled."
            />
          ) : (
            recons.map((recon: any) => (
              <div
                key={recon.id}
                className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={recon.status} />
                    <span className="text-sm font-bold text-orange-500 uppercase">
                      {recon.sourceTransaction?.vendorName || 'Vendor'} · VARIANCE CHECK
                    </span>
                  </div>
                  <p className="text-xs text-yellow-400/80 font-sans">{recon.explanation}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenDecision('RECONCILIATION', recon.id, 'Reconciliation', 'APPROVE')}
                    className="rounded-md bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-bold text-black uppercase shadow-sm"
                  >
                    APPROVE MATCH
                  </button>
                  <button
                    onClick={() => handleOpenDecision('RECONCILIATION', recon.id, 'Reconciliation', 'REJECT')}
                    className="rounded-md border border-orange-800 bg-orange-950 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-900 uppercase"
                  >
                    REJECT MATCH
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'transactions' && (
        <div className="space-y-3 font-mono">
          {txs.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No unverified transactions"
              description="All ledger transactions are validated."
            />
          ) : (
            txs.map((t: any) => (
              <div
                key={t.id}
                className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-bold text-orange-500 uppercase">{t.vendorName}</div>
                  <p className="text-xs text-yellow-400/70">
                    REF: {t.referenceNumber} · {formatDate(t.transactionDate)} · {formatCurrency(t.amount, t.currency)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDecision('TRANSACTION', t.id, t.vendorName, 'APPROVE')}
                    className="rounded-md bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-bold text-black uppercase"
                  >
                    APPROVE LEDGER
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={!!activeItem}
        onClose={() => setActiveItem(null)}
        title={`Confirm Decision: ${activeItem?.action}`}
        subtitle={`Case: ${activeItem?.title}`}
      >
        <div className="space-y-4 font-terminal text-xs">
          <p className="text-xs text-yellow-400/80">
            This action will be committed to the permanent immutable audit trail with your authorized credentials.
          </p>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">
              Sign-Off Audit Reason / Justification
            </label>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="e.g., Reviewed against monthly vendor tax statement"
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 h-24 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 font-mono">
            <button
              onClick={() => setActiveItem(null)}
              className="rounded-md border border-[#262626] px-3.5 py-1.5 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDecision}
              disabled={submitting}
              className="rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-1.5 text-xs font-bold text-black uppercase"
            >
              {submitting ? 'Applying...' : 'Confirm Sign-Off'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
