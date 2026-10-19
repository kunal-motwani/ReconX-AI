'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  BookOpen,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import { documentApi } from '@/services/api';
import { Document } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge, Badge } from '@/components/ui/Badge';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    documentApi
      .getById(params.id as string)
      .then((data) => setDocument(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingSpinner size="lg" label="LOADING DOCUMENT DOSSIER..." />;
  if (!document) {
    return (
      <div className="p-8 text-center text-yellow-400 font-terminal">
        <p className="uppercase">Document not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs text-orange-400 underline uppercase">
          Back to Documents
        </button>
      </div>
    );
  }

  const extracted = document.extractedData || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-terminal pb-10 text-yellow-400">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4 font-mono">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="rounded-md p-1.5 text-orange-400 hover:bg-[#1a1a1a] transition-colors border border-[#262626]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-orange-500 flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-5 h-5 text-orange-500" />
              {document.originalName}
            </h1>
            <p className="text-xs text-yellow-400/70 mt-0.5">
              UPLOADED ON {formatDateTime(document.createdAt)} BY{' '}
              {document.uploadedBy ? `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}` : 'SYSTEM'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={document.processingStatus} />
          <a
            href={`http://localhost:5000/api/documents/${document.id}/download`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-[#121212] px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-[#1a1a1a] uppercase"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Left 2 Cols: Extracted Data & Linked Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Structured Extraction Card */}
          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider">EXTRACTED STRUCTURED INFORMATION</h2>
              {extracted.confidence && (
                <span className="text-xs text-yellow-400 font-bold bg-yellow-950 border border-yellow-700 px-2.5 py-0.5 rounded-md uppercase">
                  {Math.round(extracted.confidence * 100)}% CONFIDENCE
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">VENDOR</span>
                <span className="font-bold text-yellow-400 text-sm mt-0.5 block uppercase">
                  {extracted.vendorName || '—'}
                </span>
              </div>
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">INVOICE #</span>
                <span className="font-bold text-orange-400 text-sm mt-0.5 block">
                  {extracted.invoiceNumber || extracted.referenceNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">TOTAL AMOUNT</span>
                <span className="font-extrabold text-yellow-400 text-sm mt-0.5 block">
                  {extracted.totalAmount || extracted.amount ? formatCurrency(extracted.totalAmount || extracted.amount, extracted.currency || 'INR') : '—'}
                </span>
              </div>
              <div>
                <span className="text-yellow-400/60 uppercase tracking-wider text-[10px] block">INVOICE DATE</span>
                <span className="font-bold text-yellow-400 text-sm mt-0.5 block">
                  {extracted.date ? formatDate(extracted.date) : '—'}
                </span>
              </div>
            </div>

            {/* Line Items Table if present */}
            {extracted.lineItems && extracted.lineItems.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-orange-400 mb-2 block uppercase">LINE ITEMS</span>
                <div className="rounded-md border border-[#262626] overflow-hidden bg-[#0a0a0a]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0a0a0a] text-orange-500 border-b border-[#262626] font-bold uppercase">
                      <tr>
                        <th className="px-3 py-2">ITEM DESCRIPTION</th>
                        <th className="px-3 py-2 text-right">QTY</th>
                        <th className="px-3 py-2 text-right">UNIT PRICE</th>
                        <th className="px-3 py-2 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-yellow-400">
                      {extracted.lineItems.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#1a1a1a]">
                          <td className="px-3 py-2 font-bold uppercase">{item.description}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice, extracted.currency)}</td>
                          <td className="px-3 py-2 text-right font-bold text-yellow-400">{formatCurrency(item.total, extracted.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Linked Normalized Transactions */}
          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-4">
            <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider">LINKED LEDGER TRANSACTIONS</h2>
            {document.transactions && document.transactions.length > 0 ? (
              <div className="space-y-3 font-mono">
                {document.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-md border border-[#262626] bg-[#0a0a0a] p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-yellow-400 uppercase">{tx.vendorName}</span>
                        <StatusBadge status={tx.status} />
                        {tx.glCode && (
                          <span className="rounded bg-[#1c1c1c] border border-[#333333] px-2 py-0.5 text-[10px] text-orange-400 font-bold uppercase">
                            GL: {tx.glCode.code} - {tx.glCode.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-yellow-400/70 mt-1 font-mono">
                        REF: {tx.referenceNumber} · DATE: {formatDate(tx.transactionDate)} · SOURCE: {tx.source}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-yellow-400 block">{formatCurrency(tx.amount, tx.currency)}</span>
                      <Link
                        href={`/transactions/${tx.id}`}
                        className="text-xs text-orange-400 hover:underline mt-0.5 inline-block uppercase"
                      >
                        INSPECT LEDGER ENTRY →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-yellow-400/60 py-4 text-center uppercase">No normalized transactions linked yet.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Metadata & Reconciliation / Anomaly Status */}
        <div className="space-y-6 font-mono">
          {/* Metadata Card */}
          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">FILE SPECIFICATION</h3>
            <div className="space-y-2 text-xs divide-y divide-[#262626]">
              <div className="flex justify-between py-1.5">
                <span className="text-yellow-400/60">MIME TYPE</span>
                <span className="text-yellow-400 font-bold">{document.fileType}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-yellow-400/60">FILE SIZE</span>
                <span className="text-yellow-400 font-bold">{Math.round(document.fileSize / 1024)} KB</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-yellow-400/60">DOCUMENT TYPE</span>
                <span className="text-yellow-400 font-bold uppercase">{document.documentType}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-yellow-400/60">STORAGE PATH</span>
                <span className="text-orange-400 text-[11px] truncate max-w-[150px]">{document.filePath}</span>
              </div>
            </div>
          </div>

          {/* Reconciliation Status Card */}
          <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">RECONCILIATION CONNECTION</h3>
            <p className="text-xs text-yellow-400/80 font-sans">
              Transactions linked to this invoice are automatically cross-checked by the multi-factor reconciliation engine against bank account statement records.
            </p>
            <Link
              href="/reconciliation"
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:underline font-bold uppercase"
            >
              <GitCompare className="w-4 h-4 text-orange-400" /> OPEN MATCH WORKSPACE [F4] →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
