'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GitCompare,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Building
} from 'lucide-react';
import { reconciliationApi } from '@/services/api';
import { Reconciliation } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';

export default function ReconciliationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    reconciliationApi
      .getById(params.id as string)
      .then(setRecon)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingSpinner size="lg" label="LOADING RECONCILIATION DOSSIER..." />;
  if (!recon) {
    return (
      <div className="p-8 text-center text-yellow-400 font-terminal">
        <p className="uppercase">Reconciliation dossier not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs text-orange-400 underline uppercase">
          Back to Matcher
        </button>
      </div>
    );
  }

  const src = recon.sourceTransaction;
  const tgt = recon.targetTransaction;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div className="flex items-center gap-3 font-mono">
          <Link
            href="/reconciliation"
            className="rounded-md p-1.5 text-orange-400 hover:bg-[#1a1a1a] transition-colors border border-[#262626]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-orange-500 flex items-center gap-2 uppercase tracking-wider">
              <GitCompare className="w-5 h-5 text-orange-500" />
              MATCH DOSSIER #{recon.id.substring(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs text-yellow-400/70 mt-0.5 font-mono">
              EVALUATED AT: {formatDateTime(recon.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <StatusBadge status={recon.status} />
          <span className="text-xs font-bold text-yellow-400 bg-yellow-950 border border-yellow-700 px-3 py-1 rounded-md">
            {Math.round(recon.confidenceScore * 100)}% CONFIDENCE
          </span>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500">MATCH REASON & REASONING SCORE</h3>
        <p className="text-xs text-yellow-400/90 font-sans leading-relaxed">{recon.explanation}</p>
        {recon.reviewedBy && (
          <p className="text-[11px] text-yellow-400/60 pt-2 border-t border-[#262626] font-mono">
            REVIEWED BY: {recon.reviewedBy.firstName} {recon.reviewedBy.lastName} AT {formatDateTime(recon.reviewedAt!)}
          </p>
        )}
      </div>

      {/* Split Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        <div className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">SOURCE INVOICE DOCUMENT</span>
            <span className="text-xs text-yellow-400/60">{formatDate(src.transactionDate)}</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-yellow-400/60 block text-[10px] uppercase">VENDOR</span>
              <span className="font-bold text-yellow-400 text-sm uppercase">{src.vendorName}</span>
            </div>
            <div>
              <span className="text-yellow-400/60 block text-[10px] uppercase">REFERENCE NO.</span>
              <span className="text-orange-400 font-bold">{src.referenceNumber}</span>
            </div>
            <div>
              <span className="text-yellow-400/60 block text-[10px] uppercase">GROSS AMOUNT</span>
              <span className="font-extrabold text-yellow-400 text-base">{formatCurrency(src.amount, src.currency)}</span>
            </div>
            {src.document && (
              <div className="pt-2">
                <Link href={`/documents/${src.document.id}`} className="text-orange-400 hover:underline text-xs">
                  [F2] VIEW ATTACHED FILE ({src.document.originalName}) →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">TARGET BANK SETTLEMENT</span>
            <span className="text-xs text-yellow-400/60">{formatDate(tgt.transactionDate)}</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-yellow-400/60 block text-[10px] uppercase">BANK STATEMENT VENDOR</span>
              <span className="font-bold text-yellow-400 text-sm uppercase">{tgt.vendorName}</span>
            </div>
            <div>
              <span className="text-yellow-400/60 block text-[10px] uppercase">BANK REF / UTR</span>
              <span className="text-orange-400 font-bold">{tgt.referenceNumber}</span>
            </div>
            <div>
              <span className="text-yellow-400/60 block text-[10px] uppercase">SETTLED AMOUNT</span>
              <span className={`font-extrabold text-base ${recon.amountMatch ? 'text-yellow-400' : 'text-orange-500'}`}>
                {formatCurrency(tgt.amount, tgt.currency)}
              </span>
            </div>
            <div className="pt-2">
              <span className="text-yellow-400/70 text-xs font-sans">{tgt.description}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
