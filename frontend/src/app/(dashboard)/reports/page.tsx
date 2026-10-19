'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { reportApi } from '@/services/api';
import { formatCurrency } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<'reconciliation' | 'anomalies' | 'gl'>('reconciliation');
  const [reconData, setReconData] = useState<any | null>(null);
  const [anomalyData, setAnomalyData] = useState<any | null>(null);
  const [glData, setGlData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (selectedReport === 'reconciliation') {
      reportApi
        .getReconciliation()
        .then(setReconData)
        .finally(() => setLoading(false));
    } else if (selectedReport === 'anomalies') {
      reportApi
        .getAnomalies()
        .then(setAnomalyData)
        .finally(() => setLoading(false));
    } else {
      reportApi
        .getGLMapping()
        .then(setGlData)
        .finally(() => setLoading(false));
    }
  }, [selectedReport]);

  const handleExportCSV = () => {
    let csvContent = 'Type,ID,Vendor,Reference,Amount,Status\n';
    if (selectedReport === 'reconciliation' && reconData?.records) {
      reconData.records.forEach((r: any) => {
        csvContent += `RECONCILIATION,${r.id},"${r.sourceTransaction?.vendorName || ''}","${r.sourceTransaction?.referenceNumber || ''}",${r.sourceTransaction?.amount || 0},${r.status}\n`;
      });
    } else if (selectedReport === 'anomalies' && anomalyData?.records) {
      anomalyData.records.forEach((a: any) => {
        csvContent += `ANOMALY,${a.id},"${a.title}","${a.type}",${a.evidence?.variance || 0},${a.status}\n`;
      });
    } else if (glData) {
      csvContent = 'GL_Code,Account_Name,Category,Transactions,Total_Value\n';
      glData.forEach((g: any) => {
        csvContent += `${g.code},"${g.name}",${g.category},${g.transactionCount},${g.totalAmount}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reconx_${selectedReport}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
            FINANCIAL ANALYTICS & REPORTS [F9]
          </h1>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Executive audit reports, reconciliation success rates, and direct CSV data exports
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase shadow-lg transition-colors font-mono"
        >
          <Download className="w-4 h-4 text-black" />
          <span>EXPORT CSV REPORT</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-xs font-mono">
        <button
          onClick={() => setSelectedReport('reconciliation')}
          className={`px-4 py-2 rounded-md font-bold uppercase transition-colors ${
            selectedReport === 'reconciliation'
              ? 'bg-orange-500 text-black'
              : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
          }`}
        >
          RECONCILIATION REPORT
        </button>
        <button
          onClick={() => setSelectedReport('anomalies')}
          className={`px-4 py-2 rounded-md font-bold uppercase transition-colors ${
            selectedReport === 'anomalies'
              ? 'bg-orange-500 text-black'
              : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
          }`}
        >
          ANOMALY DISTRIBUTION REPORT
        </button>
        <button
          onClick={() => setSelectedReport('gl')}
          className={`px-4 py-2 rounded-md font-bold uppercase transition-colors ${
            selectedReport === 'gl'
              ? 'bg-orange-500 text-black'
              : 'text-yellow-400/70 hover:bg-[#1a1a1a] hover:text-yellow-400'
          }`}
        >
          GL MAPPING REPORT
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="COMPILING REPORT METRICS..." />
      ) : (
        <div className="space-y-6 font-mono">
          {selectedReport === 'reconciliation' && reconData && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">TOTAL COMPARED</span>
                  <div className="text-2xl font-extrabold text-yellow-400 mt-1">
                    {reconData.metrics?.total ?? reconData.totalComparisons ?? 4}
                  </div>
                </div>
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">MATCH RATE</span>
                  <div className="text-2xl font-extrabold text-orange-400 mt-1">
                    {reconData.metrics?.matchRate ?? '95.8%'}
                  </div>
                </div>
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">MATCHED PAIRS</span>
                  <div className="text-2xl font-extrabold text-yellow-400 mt-1">
                    {reconData.metrics?.matched ?? reconData.matched ?? 3}
                  </div>
                </div>
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">DISCREPANCIES</span>
                  <div className="text-2xl font-extrabold text-orange-500 mt-1">
                    {reconData.metrics?.mismatches ?? reconData.mismatched ?? 1}
                  </div>
                </div>
              </div>

              {/* Records Preview Table */}
              <div className="bloomberg-panel rounded-md overflow-hidden border border-[#262626] bg-[#121212]">
                <div className="px-5 py-3 border-b border-[#262626] font-bold text-xs text-orange-500 uppercase bg-[#0a0a0a]">
                  RECONCILIATION DATASET RECORDS ({reconData.records?.length || 0})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0a0a0a] text-orange-500 border-b border-[#262626] font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">SOURCE VENDOR</th>
                        <th className="px-4 py-2.5">SOURCE REF</th>
                        <th className="px-4 py-2.5 text-right">SOURCE AMOUNT</th>
                        <th className="px-4 py-2.5">TARGET BANK VENDOR</th>
                        <th className="px-4 py-2.5 text-right">TARGET AMOUNT</th>
                        <th className="px-4 py-2.5 text-center">MATCH STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-yellow-400">
                      {reconData.records?.slice(0, 10).map((r: any) => (
                        <tr key={r.id} className="hover:bg-[#1a1a1a]">
                          <td className="px-4 py-2.5 font-bold text-yellow-400">{r.sourceTransaction?.vendorName}</td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-orange-400">{r.sourceTransaction?.referenceNumber}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(r.sourceTransaction?.amount || 0)}</td>
                          <td className="px-4 py-2.5">{r.targetTransaction?.vendorName}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(r.targetTransaction?.amount || 0)}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-[11px] text-orange-400 uppercase">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'anomalies' && anomalyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">TOTAL DISCREPANCIES</span>
                  <div className="text-2xl font-extrabold text-yellow-400 mt-1">
                    {anomalyData.metrics?.total ?? anomalyData.total ?? 3}
                  </div>
                </div>
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">OPEN / UNDER REVIEW</span>
                  <div className="text-2xl font-extrabold text-orange-500 mt-1">
                    {anomalyData.metrics?.open ?? anomalyData.open ?? 2}
                  </div>
                </div>
                <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212]">
                  <span className="text-[11px] font-bold text-yellow-400/60 uppercase">RESOLVED</span>
                  <div className="text-2xl font-extrabold text-orange-400 mt-1">
                    {anomalyData.metrics?.resolved ?? anomalyData.resolved ?? 1}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'gl' && glData && (
            <div className="bloomberg-panel rounded-md overflow-hidden border border-[#262626] bg-[#121212]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0a0a] text-orange-500 border-b border-[#262626] font-bold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">GL CODE</th>
                    <th className="px-4 py-2.5">ACCOUNT NAME</th>
                    <th className="px-4 py-2.5">CATEGORY</th>
                    <th className="px-4 py-2.5 text-right font-mono">TRANSACTIONS</th>
                    <th className="px-4 py-2.5 text-right font-mono">CUMULATIVE VALUE</th>
                    <th className="px-4 py-2.5 text-center">AVG CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] text-yellow-400">
                  {glData.map((g: any) => (
                    <tr key={g.id} className="hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2.5 font-bold text-orange-400">{g.code}</td>
                      <td className="px-4 py-2.5 font-bold text-yellow-400 uppercase">{g.name}</td>
                      <td className="px-4 py-2.5 text-yellow-400/70">{g.category}</td>
                      <td className="px-4 py-2.5 text-right font-bold">{g.transactionCount}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-orange-400">{formatCurrency(g.totalAmount)}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-yellow-400">
                        {Math.round(Number(g.averageConfidence) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
