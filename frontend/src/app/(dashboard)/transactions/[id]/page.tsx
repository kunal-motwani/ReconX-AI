'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowLeftRight,
  GitCompare,
  AlertTriangle,
  FileText,
  Calendar,
  Building,
  CheckCircle2
} from 'lucide-react';
import { transactionApi } from '@/services/api';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    transactionApi
      .getById(params.id as string)
      .then(setTransaction)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingSpinner size="lg" label="LOADING TRANSACTION DOSSIER..." />;
  if (!transaction) {
    return (
      <div className="p-8 text-center text-yellow-400 font-terminal">
        <p className="uppercase">Transaction not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs text-orange-400 underline uppercase">
          Back to Transactions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-terminal pb-10 text-yellow-400">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4 font-mono">
        <div className="flex items-center gap-3">
          <Link
            href="/transactions"
            className="rounded-md p-1.5 text-orange-400 hover:bg-[#1a1a1a] transition-colors border border-[#262626]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-orange-500 flex items-center gap-2 uppercase tracking-wider">
              <ArrowLeftRight className="w-5 h-5 text-orange-500" />
              {transaction.vendorName}
            </h1>
            <p className="text-xs text-yellow-400/70 mt-0.5 font-mono">
              REF: {transaction.referenceNumber} · {formatDate(transaction.transactionDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={transaction.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Core Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-5">
            <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider border-b border-[#262626] pb-3">
              TRANSACTION DETAILS
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">AMOUNT</span>
                <span className="font-extrabold text-yellow-400 text-base mt-0.5 block">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">SOURCE</span>
                <span className="font-bold text-yellow-400 text-sm mt-0.5 block uppercase">{transaction.source}</span>
              </div>
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">LEDGER TYPE</span>
                <span className="font-bold text-yellow-400 text-sm mt-0.5 block uppercase">{transaction.transactionType}</span>
              </div>
            </div>

            <div className="border-t border-[#262626] pt-3">
              <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">DESCRIPTION</span>
              <p className="text-xs text-yellow-400/90 mt-1 font-sans">{transaction.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* GL Mapping Block */}
          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider">GENERAL LEDGER CODE MAPPING</h2>
              {transaction.glConfidence && (
                <span className="text-xs font-bold text-yellow-400 bg-yellow-950 border border-yellow-700 px-2.5 py-0.5 rounded-md uppercase">
                  {Math.round(transaction.glConfidence * 100)}% CONFIDENCE
                </span>
              )}
            </div>

            {transaction.glCode ? (
              <div className="rounded-md bg-[#0a0a0a] p-4 border border-[#262626] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-400 text-sm">{transaction.glCode.code}</span>
                    <span className="font-bold text-yellow-400 text-sm uppercase">{transaction.glCode.name}</span>
                  </div>
                  <p className="text-xs text-yellow-400/60 mt-1 font-sans">{transaction.glCode.description || transaction.glCode.category}</p>
                </div>
                <span className="rounded bg-[#1c1c1c] border border-[#333333] px-2.5 py-1 text-xs font-bold text-orange-400 uppercase">
                  {transaction.glStatus || 'SUGGESTED'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-yellow-400/60 py-3 text-center uppercase">No GL code mapped to this transaction.</p>
            )}
          </div>
        </div>

        {/* Right Col: Supporting Doc & Matching */}
        <div className="space-y-6 font-mono">
          {transaction.document && (
            <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">SUPPORTING DOCUMENT</h3>
              <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span className="truncate">{transaction.document.originalName}</span>
                </div>
                <Link
                  href={`/documents/${transaction.document.id}`}
                  className="text-xs text-orange-400 hover:underline block uppercase"
                >
                  VIEW DOCUMENT DOSSIER [F2] →
                </Link>
              </div>
            </div>
          )}

          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">RECONCILIATION ACTION</h3>
            <p className="text-xs text-yellow-400/80 font-sans">
              Check match status in the reconciliation workspace against counterpart bank debits.
            </p>
            <Link
              href="/reconciliation"
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:underline font-bold uppercase"
            >
              <GitCompare className="w-4 h-4 text-orange-400" /> GO TO MATCH WORKSPACE [F4] →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
