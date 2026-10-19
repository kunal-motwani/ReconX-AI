'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  SearchCheck,
  FileText,
  Building,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { anomalyApi, investigationApi } from '@/services/api';
import { Anomaly } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';

export default function AnomalyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    anomalyApi
      .getById(params.id as string)
      .then(setAnomaly)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleStartInvestigation = async () => {
    if (!anomaly) return;
    setInitiating(true);
    try {
      const inv = await investigationApi.create(anomaly.id);
      router.push(`/investigations/${inv.id}`);
    } catch (err: any) {
      alert(err.message || 'Could not start investigation');
    } finally {
      setInitiating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" label="LOADING ANOMALY DOSSIER..." />;
  if (!anomaly) {
    return (
      <div className="p-8 text-center text-yellow-400 font-terminal">
        <p className="uppercase">Anomaly not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs text-orange-400 underline uppercase">
          Back to Anomalies
        </button>
      </div>
    );
  }

  const tx = anomaly.transaction;
  const evidence = anomaly.evidence || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex items-center justify-between border-b border-[#262626] pb-4 font-mono">
        <div className="flex items-center gap-3">
          <Link
            href="/anomalies"
            className="rounded-md p-1.5 text-orange-400 hover:bg-[#1a1a1a] transition-colors border border-[#262626]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-orange-500 flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {anomaly.title}
            </h1>
            <p className="text-xs text-yellow-400/70 mt-0.5 font-mono">
              CASE #{anomaly.id.substring(0, 8).toUpperCase()} · FLAGGED {formatDateTime(anomaly.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={anomaly.severity} />
          <StatusBadge status={anomaly.status} />
        </div>
      </div>

      {/* Overview & Recommendation */}
      <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-4 font-terminal">
        <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider border-b border-[#262626] pb-2 font-mono">
          ANOMALY DIAGNOSTICS
        </h2>
        <p className="text-xs text-yellow-400/90 font-sans leading-relaxed">{anomaly.description}</p>

        <div className="rounded-md bg-[#0a0a0a] p-4 border border-[#262626] space-y-1 font-mono">
          <span className="text-xs font-bold text-orange-400 uppercase">ACTIONABLE RECOMMENDATION:</span>
          <p className="text-xs text-yellow-400 font-sans">{anomaly.recommendedAction || 'Audit verification required.'}</p>
        </div>

        {/* Existing Investigation or Create Investigation */}
        {anomaly.investigations && anomaly.investigations.length > 0 ? (
          <div className="pt-2 font-mono">
            <Link
              href={`/investigations/${anomaly.investigations[0].id}`}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase transition-colors"
            >
              <SearchCheck className="w-4 h-4 text-black" />
              <span>OPEN ACTIVE INVESTIGATION DOSSIER [F6] →</span>
            </Link>
          </div>
        ) : (
          <div className="pt-2 font-mono">
            <button
              onClick={handleStartInvestigation}
              disabled={initiating}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase transition-colors"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{initiating ? 'SYNTHESIZING EVIDENCE...' : 'INITIATE ROOT-CAUSE INVESTIGATION'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Evidence Viewer */}
      <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-4 font-mono">
        <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider border-b border-[#262626] pb-2">
          SYNTHESIZED AUDIT EVIDENCE
        </h2>

        <div className="rounded-md bg-[#0a0a0a] p-4 border border-[#262626] font-mono text-xs text-yellow-400 overflow-x-auto">
          <pre>{JSON.stringify(evidence, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
