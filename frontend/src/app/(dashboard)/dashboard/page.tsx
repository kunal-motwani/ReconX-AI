'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  ChevronRight,
  Sparkles,
  Zap,
  Cpu,
  FileCheck,
  ScanLine,
  Award,
} from 'lucide-react';
import { dashboardApi } from '@/services/api';
import { DashboardStats } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';
import { LiveStreamTicker } from '@/components/dashboard/LiveStreamTicker';
import { AgentReasoningTraceModal } from '@/components/dashboard/AgentReasoningTraceModal';
import { ComplianceCertificateModal } from '@/components/common/ComplianceCertificateModal';
import { NeuralVectorRadar } from '@/components/dashboard/NeuralVectorRadar';
import { XRayMatchVisualizer } from '@/components/dashboard/XRayMatchVisualizer';
import { useDesignSystem } from '@/context/DesignSystemContext';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVisualLab, setActiveVisualLab] = useState<'radar' | 'xray'>('radar');

  const { setIsUxTourOpen, playSound } = useDesignSystem();

  // Modals state
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load terminal metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" label="INITIALIZING RECONX HYPERBLOOM TERMINAL FEED..." />;
  }

  if (error || !stats) {
    return (
      <div className="rounded-md border border-orange-800 bg-orange-950/60 p-8 text-center text-orange-300 font-terminal">
        <p className="font-bold text-sm uppercase">{error || 'TERMINAL CONNECTION ERROR'}</p>
        <button
          onClick={fetchStats}
          className="mt-4 rounded-md bg-orange-600 px-5 py-2 text-xs font-bold text-black hover:bg-orange-500 shadow-lg uppercase"
        >
          RETRY FEED
        </button>
      </div>
    );
  }

  const { kpis, charts, recentActivity, attentionRequired } = stats;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-terminal text-yellow-400">
      {/* Header Banner */}
      <div className="rounded-md border border-[#262626] bg-[#121212] p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600"></span>
              </span>
              <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
                RECONX // COMMAND TERMINAL [F1]
              </h1>
              <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-500/40 uppercase">
                6 AGENTS ACTIVE
              </span>
              <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/40 uppercase">
                HYPERBLOOM UX EDITION
              </span>
            </div>
            <p className="text-xs text-yellow-400/70 mt-1 font-sans">
              Autonomous bank statement ingestion, interactive 5-factor vector radar, X-ray diff alignment & cryptographic SOX compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            <button
              onClick={() => {
                playSound('click');
                setIsUxTourOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-md bg-orange-950/60 border border-orange-500/60 hover:bg-orange-900 px-3 py-2 text-xs font-bold text-orange-400 uppercase tracking-wider transition-colors"
            >
              <Award className="w-4 h-4 text-orange-400" />
              <span>JUDGE TOUR</span>
            </button>

            <button
              onClick={() => {
                playSound('scan');
                setIsTraceOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-md bg-[#1c1c1c] border border-[#333333] hover:border-orange-500 px-3 py-2 text-xs font-bold text-yellow-400 uppercase tracking-wider transition-colors"
            >
              <Cpu className="w-4 h-4 text-orange-500" />
              <span>AI TRACE</span>
            </button>

            <button
              onClick={() => {
                playSound('success');
                setIsCertOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-md bg-[#1c1c1c] border border-[#333333] hover:border-orange-500 px-3 py-2 text-xs font-bold text-yellow-400 uppercase tracking-wider transition-colors"
            >
              <FileCheck className="w-4 h-4 text-orange-500" />
              <span>SOX CERT</span>
            </button>

            <Link
              href="/reconciliation"
              onClick={() => playSound('click')}
              className="flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase tracking-wider transition-colors shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>MATCHER [F4]</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-Time Live Streaming Ingestion Ticker */}
      <LiveStreamTicker />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bloomberg-panel rounded-md p-4.5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              TOTAL TRANSACTIONS
            </span>
            <div className="rounded bg-[#1c1c1c] border border-[#333333] p-2 text-yellow-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-yellow-400 font-mono">{kpis.totalTransactions}</div>
            <div className="text-xs text-yellow-400/80 mt-1">
              GROSS: <span className="text-orange-400 font-bold font-mono">{formatCurrency(kpis.totalTransactionValue)}</span>
            </div>
          </div>
        </div>

        {/* Reconciled Rate */}
        <div className="bloomberg-panel rounded-md p-4.5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              RECONCILED RATE
            </span>
            <div className="rounded bg-[#1c1c1c] border border-[#333333] p-2 text-yellow-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-extrabold text-yellow-400 font-mono">{kpis.reconciled}</div>
              <span className="text-xs font-bold text-orange-400">({kpis.reconciliationRate}%)</span>
            </div>
            <div className="w-full bg-[#1c1c1c] h-2 rounded overflow-hidden mt-2.5 border border-[#333333]">
              <div
                className="bg-orange-500 h-full transition-all duration-700"
                style={{ width: `${Math.min(100, kpis.reconciliationRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bloomberg-panel rounded-md p-4.5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              PENDING REVIEW
            </span>
            <div className="rounded bg-orange-950 border border-orange-800 p-2 text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-orange-400 font-mono">{kpis.pendingReview}</div>
            <p className="text-[11px] text-yellow-400/80 mt-1">Requires 1-Click Approval [F7]</p>
          </div>
        </div>

        {/* Active Anomalies */}
        <div className="bloomberg-panel rounded-md p-4.5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              ACTIVE ANOMALIES
            </span>
            <div className="rounded bg-orange-950 border border-orange-800 p-2 text-orange-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-orange-400 font-mono">{kpis.anomalies}</div>
            <div className="text-[10px] text-yellow-400 mt-1 flex items-center gap-2 font-mono">
              <span className="text-orange-400 font-bold">{kpis.duplicatePayments} DUP</span>
              <span>•</span>
              <span className="text-yellow-400 font-bold">{kpis.amountMismatches} MISMATCH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Intelligence Workbench (Switch between 5-Factor Radar & X-Ray Laser Diff) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-[#121212] px-4 py-2.5 rounded-md border border-[#262626] font-mono text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="font-extrabold text-orange-400 uppercase tracking-wider">
              INTERACTIVE AI VISUALIZATION LAB (USP)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                setActiveVisualLab('radar');
              }}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                activeVisualLab === 'radar'
                  ? 'bg-orange-500 text-black'
                  : 'bg-[#0a0a0a] text-yellow-400/70 border border-[#262626] hover:text-yellow-400'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>5-FACTOR VECTOR RADAR</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                setActiveVisualLab('xray');
              }}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                activeVisualLab === 'xray'
                  ? 'bg-orange-500 text-black'
                  : 'bg-[#0a0a0a] text-yellow-400/70 border border-[#262626] hover:text-yellow-400'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>X-RAY LASER DIFF LOUPE</span>
            </button>
          </div>
        </div>

        {activeVisualLab === 'radar' ? <NeuralVectorRadar /> : <XRayMatchVisualizer />}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transaction Volume Trend */}
        <div className="lg:col-span-2 bloomberg-panel rounded-md p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                VOLUME & LEDGER VALUE PROGRESSION
              </h3>
              <p className="text-[11px] text-yellow-400/70 font-sans">Monthly continuous auto-matched settlement totals</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold font-mono">
              <span className="text-yellow-400">■ VOLUME</span>
              <span className="text-orange-500">■ VALUE (₹)</span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-3 px-2">
            {charts.volumeOverTime.map((item, idx) => {
              const maxVal = 700000;
              const heightPct = Math.min(100, Math.max(18, (item.value / maxVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-yellow-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(item.value)}
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-[#1c1c1c] rounded overflow-hidden flex flex-col justify-end border border-[#333333]"
                    style={{ height: '80%' }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-orange-600 via-yellow-500 to-yellow-400 rounded-t transition-all duration-700"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-yellow-400/80 uppercase truncate w-full text-center font-mono">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GL Expense Allocation */}
        <div className="bloomberg-panel rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider">CHART OF ACCOUNTS</h3>
                <p className="text-[11px] text-yellow-400/70 font-sans">GL distribution</p>
              </div>
              <Link href="/gl-codes" className="text-xs font-bold text-orange-400 hover:underline font-mono">
                [F8] VIEW ALL
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {charts.glDistribution.slice(0, 5).map((gl, idx) => {
                const totalAmt = charts.glDistribution.reduce((acc, curr) => acc + curr.amount, 0) || 1;
                const pct = Math.round((gl.amount / totalAmt) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-yellow-400 truncate max-w-[150px]">
                        {gl.code} · {gl.name}
                      </span>
                      <span className="text-orange-400 font-bold">{formatCurrency(gl.amount)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1c1c1c] rounded overflow-hidden border border-[#333333]">
                      <div
                        className="h-full bg-orange-500 rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-[#262626] flex items-center justify-between text-[11px] text-yellow-400/80 font-mono">
            <span>CLASSIFIER</span>
            <span className="text-orange-400 font-bold uppercase">100% RAG-MAPPED</span>
          </div>
        </div>
      </div>

      {/* Attention Required & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* High Priority Attention Required */}
        <div className="lg:col-span-2 bloomberg-panel rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider">ATTENTION REQUIRED WORKSPACE</h3>
            </div>
            <Link href="/anomalies" className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 font-mono">
              ANOMALY CENTER [F5] <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {attentionRequired.length === 0 ? (
            <p className="text-xs text-yellow-400/60 py-6 text-center">No open discrepancies requiring attention.</p>
          ) : (
            <div className="space-y-2.5">
              {attentionRequired.map((anom) => (
                <div
                  key={anom.id}
                  className="rounded-md border border-[#262626] bg-[#0a0a0a] p-3.5 hover:border-orange-500 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={anom.severity} />
                      <span className="text-xs font-bold text-orange-400 uppercase">{anom.title}</span>
                    </div>
                    <p className="text-xs text-yellow-400/80 line-clamp-1 font-sans">{anom.description}</p>
                    <p className="text-[11px] text-orange-400 font-bold flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-orange-400" />
                      ACTION: {anom.recommendedAction || 'Review invoice and bank entry'}
                    </p>
                  </div>

                  <Link
                    href={`/anomalies/${anom.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded bg-orange-950 border border-orange-800 hover:bg-orange-900 px-3 py-1.5 text-xs font-bold text-orange-400 uppercase transition-colors font-mono"
                  >
                    <span>INVESTIGATE</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Audit Feed */}
        <div className="bloomberg-panel rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider">LIVE AUDIT FEED</h3>
            </div>
            <Link href="/audit-logs" className="text-xs font-bold text-orange-400 hover:underline font-mono">
              [F10] AUDIT
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="text-xs border-l-2 border-orange-500 pl-2.5 py-1 space-y-0.5 bg-[#0a0a0a] rounded-r font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-400 uppercase">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-yellow-400 font-bold">{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="text-[10px] text-yellow-400/70 font-sans">
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'AUTONOMOUS AGENT'} ON {log.entity}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Multi-Agent Reasoning Trace Modal */}
      <AgentReasoningTraceModal isOpen={isTraceOpen} onClose={() => setIsTraceOpen(false)} />

      {/* Compliance SOX Certificate Modal */}
      <ComplianceCertificateModal isOpen={isCertOpen} onClose={() => setIsCertOpen(false)} />
    </div>
  );
}
