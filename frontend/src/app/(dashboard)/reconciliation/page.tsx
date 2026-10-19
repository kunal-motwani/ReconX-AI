'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  X,
  FileText,
  Building,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { reconciliationApi } from '@/services/api';
import { Reconciliation } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { XRayMatchVisualizer } from '@/components/dashboard/XRayMatchVisualizer';

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // Approval/Rejection Modal
  const [activeRecon, setActiveRecon] = useState<Reconciliation | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const data = await reconciliationApi.list(statusFilter || undefined);
      setReconciliations(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [statusFilter]);

  const handleRunBatch = async () => {
    setRunning(true);
    setBatchNotice(null);
    try {
      const res = await reconciliationApi.run();
      setBatchNotice(
        `Batch reconciliation finished: ${res.matchedCount} matches verified, ${res.mismatchCount} amount mismatches flagged.`
      );
      fetchReconciliations();
    } catch (err: any) {
      alert(err.message || 'Reconciliation execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleOpenDecision = (recon: Reconciliation, action: 'approve' | 'reject') => {
    setActiveRecon(recon);
    setDecisionAction(action);
    setDecisionNotes('');
  };

  const handleConfirmDecision = async () => {
    if (!activeRecon || !decisionAction) return;
    setSubmitting(true);
    try {
      if (decisionAction === 'approve') {
        await reconciliationApi.approve(activeRecon.id, decisionNotes);
      } else {
        await reconciliationApi.reject(activeRecon.id, decisionNotes);
      }
      setActiveRecon(null);
      setDecisionAction(null);
      fetchReconciliations();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
              SMART MATCHER ENGINE [F4]
            </h1>
            <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-500/40 uppercase">
              MULTI-FACTOR WEIGHTED FUZZY
            </span>
          </div>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Autonomous side-by-side comparison of invoices/vouchers against banking transactions
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <button
            onClick={handleRunBatch}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black shadow-lg disabled:opacity-50 transition-colors uppercase"
          >
            <Play className={`w-4 h-4 fill-current text-black ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'RUNNING BATCH MATCHING...' : 'RUN BATCH MATCH [F4]'}</span>
          </button>
        </div>
      </div>

      {batchNotice && (
        <div className="flex items-center gap-2 rounded-md border border-orange-500 bg-orange-950 px-4 py-3 text-xs text-orange-400 font-bold font-mono animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <span>{batchNotice}</span>
        </div>
      )}

      {/* Interactive X-Ray Laser Diff Workbench */}
      <XRayMatchVisualizer />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 bg-[#121212] p-3 rounded-md border border-[#262626] font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === '' ? 'bg-orange-500 text-black' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            ALL COMPARISONS
          </button>
          <button
            onClick={() => setStatusFilter('MATCHED')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === 'MATCHED' ? 'bg-orange-500 text-black' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            MATCHED
          </button>
          <button
            onClick={() => setStatusFilter('AMOUNT_MISMATCH')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === 'AMOUNT_MISMATCH' ? 'bg-orange-950 text-orange-400 border border-orange-800' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            AMOUNT MISMATCHES
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-md font-bold uppercase transition-colors ${
              statusFilter === 'APPROVED' ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
            }`}
          >
            APPROVED
          </button>
        </div>

        <button
          onClick={fetchReconciliations}
          className="rounded-md p-1.5 text-orange-400 hover:bg-[#1a1a1a]"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Reconciliations Split Cards */}
      {loading ? (
        <LoadingSpinner label="LOADING RECONCILIATION MATCH PAIRS..." />
      ) : reconciliations.length === 0 ? (
        <EmptyState
          icon={GitCompare}
          title="No reconciliation matches found"
          description="Click 'Run Batch Reconciliation' to compare source transactions with bank statement debits."
          actionLabel="Run Batch Reconciliation"
          onAction={handleRunBatch}
        />
      ) : (
        <div className="space-y-4">
          {reconciliations.map((recon) => {
            const src = recon.sourceTransaction;
            const tgt = recon.targetTransaction;
            const pct = Math.round(recon.confidenceScore * 100);

            return (
              <div
                key={recon.id}
                className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-4"
              >
                {/* Comparison Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3 font-mono">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={recon.status} />
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${
                        pct >= 85
                          ? 'bg-yellow-950 text-yellow-400 border-yellow-700'
                          : pct >= 50
                          ? 'bg-orange-950 text-orange-400 border-orange-700'
                          : 'bg-red-950 text-red-400 border-red-800'
                      }`}
                    >
                      {pct}% MATCH CONFIDENCE
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {recon.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleOpenDecision(recon, 'approve')}
                        className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-bold text-black uppercase transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-black" />
                        <span>APPROVE</span>
                      </button>
                    )}
                    {recon.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleOpenDecision(recon, 'reject')}
                        className="inline-flex items-center gap-1.5 rounded-md border border-orange-800 bg-orange-950 hover:bg-orange-900 px-3 py-1.5 text-xs font-bold text-orange-400 uppercase transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>FLAG / REJECT</span>
                      </button>
                    )}
                    <Link
                      href={`/reconciliation/${recon.id}`}
                      className="rounded-md border border-[#333333] bg-[#0a0a0a] px-2.5 py-1.5 text-xs text-yellow-400 hover:border-orange-500 uppercase"
                    >
                      DETAILS →
                    </Link>
                  </div>
                </div>

                {/* Split View: Left (Source Invoice/PO) vs Right (Bank Debit) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                  {/* Left: Source Transaction */}
                  <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-[#262626] pb-2">
                      <span className="font-bold text-orange-500 uppercase tracking-wider text-[10px]">
                        SOURCE RECORD ({src?.source || 'INVOICE'})
                      </span>
                      <span className="text-yellow-400/60">{src?.transactionDate ? formatDate(src.transactionDate) : ''}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-extrabold text-yellow-400">{src?.vendorName}</div>
                      <div className="text-xs font-mono text-orange-400">REF: {src?.referenceNumber}</div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-yellow-400/70">LEDGER AMOUNT</span>
                      <span className="text-base font-extrabold text-yellow-400">
                        {src ? formatCurrency(src.amount, src.currency) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Target Bank Transaction */}
                  <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-[#262626] pb-2">
                      <span className="font-bold text-orange-500 uppercase tracking-wider text-[10px]">
                        TARGET BANKING RECORD (HDFC BANK)
                      </span>
                      <span className="text-yellow-400/60">{tgt?.transactionDate ? formatDate(tgt.transactionDate) : ''}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-extrabold text-yellow-400">{tgt?.vendorName}</div>
                      <div className="text-xs font-mono text-orange-400">REF: {tgt?.referenceNumber}</div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-yellow-400/70">BANK DEBIT</span>
                      <span
                        className={`text-base font-extrabold ${
                          recon.amountMatch ? 'text-yellow-400' : 'text-orange-500'
                        }`}
                      >
                        {tgt ? formatCurrency(tgt.amount, tgt.currency) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Score Indicators & Explanation */}
                <div className="rounded-md bg-[#0a0a0a] p-3 border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-4 text-yellow-400/80">
                    <span className="flex items-center gap-1.5">
                      {recon.amountMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-orange-500" />
                      )}
                      AMOUNT
                    </span>
                    <span className="flex items-center gap-1.5">
                      {recon.vendorMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-orange-500" />
                      )}
                      VENDOR
                    </span>
                    <span className="flex items-center gap-1.5">
                      {recon.dateMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-orange-500" />
                      )}
                      DATE
                    </span>
                    <span className="flex items-center gap-1.5">
                      {recon.referenceMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-neutral-700 flex items-center justify-center text-[9px]">
                          -
                        </span>
                      )}
                      REF
                    </span>
                  </div>

                  <p className="text-orange-400 text-xs italic sm:max-w-md truncate font-sans">
                    {recon.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={!!activeRecon}
        onClose={() => setActiveRecon(null)}
        title={decisionAction === 'approve' ? 'Approve Reconciliation Match' : 'Reject & Flag Discrepancy'}
        subtitle={`Audit recording for #${activeRecon?.id.substring(0, 8).toUpperCase()}`}
      >
        <div className="space-y-4 font-terminal text-xs">
          <p className="text-xs text-yellow-400/80">
            {decisionAction === 'approve'
              ? 'Approving this match will mark both the source invoice and the bank debit transactions as APPROVED in the general ledger.'
              : 'Rejecting this match will trigger an investigation case and keep the transaction open for human review.'}
          </p>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">
              Audit Note / Sign-off Justification
            </label>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="e.g., Reviewed against TDS Form 16A withholding schedule"
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 h-24 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 font-mono">
            <button
              onClick={() => setActiveRecon(null)}
              className="rounded-md border border-[#262626] px-3.5 py-1.5 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDecision}
              disabled={submitting}
              className="rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-1.5 text-xs font-bold text-black uppercase"
            >
              {submitting ? 'Applying...' : decisionAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
