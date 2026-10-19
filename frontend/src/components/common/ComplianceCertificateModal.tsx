'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, Download, Printer, CheckCircle2, Lock, FileText, Award } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';

export const ComplianceCertificateModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OFFICIAL COMPLIANCE & RECONCILIATION CERTIFICATE"
      subtitle="SOX 404 & SOC 2 Type II Cryptographic Verification Dossier"
      maxWidth="2xl"
    >
      <div className="space-y-6 font-terminal text-yellow-400 p-2">
        {/* Certificate Container */}
        <div className="border-2 border-orange-500/80 bg-[#0a0a0a] p-6 rounded-md space-y-6 relative overflow-hidden shadow-2xl">
          {/* Decorative Corner Seals */}
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Award className="w-24 h-24 text-orange-500" />
          </div>

          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <div>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block font-mono">
                RECONX FINANCIAL COMPLIANCE DESK
              </span>
              <h2 className="text-lg font-extrabold text-orange-500 uppercase tracking-wider font-mono">
                STATEMENT OF RECONCILIATION
              </h2>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-yellow-400/60 block">CERTIFICATE ID</span>
              <span className="text-xs font-bold text-yellow-400 font-mono">CERT-2026-990812X</span>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="space-y-4 text-xs font-mono">
            <p className="text-yellow-400/90 leading-relaxed font-sans">
              This official certificate attests that all source vendor invoices, credit notes, and counterpart bank statement debits for <strong className="text-orange-400">ABC Technologies Pvt Ltd</strong> have been ingested, cross-referenced, and verified by the ReconX Autonomous Multi-Agent ML Engine.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#121212] p-4 rounded border border-[#262626]">
              <div>
                <span className="text-yellow-400/60 text-[10px] block uppercase">AUDIT PERIOD</span>
                <span className="font-bold text-yellow-400">AUGUST 2026</span>
              </div>
              <div>
                <span className="text-yellow-400/60 text-[10px] block uppercase">TOTAL RECONCILED VALUE</span>
                <span className="font-bold text-yellow-400">₹14,45,750.00</span>
              </div>
              <div>
                <span className="text-yellow-400/60 text-[10px] block uppercase">MATCH CONFIDENCE RATE</span>
                <span className="font-bold text-orange-400">97.8% WEIGHTED</span>
              </div>
              <div>
                <span className="text-yellow-400/60 text-[10px] block uppercase">ANOMALIES RESOLVED</span>
                <span className="font-bold text-yellow-400">4 CASES SIGNED OFF</span>
              </div>
              <div>
                <span className="text-yellow-400/60 text-[10px] block uppercase">TDS 194Q COMPLIANCE</span>
                <span className="font-bold text-yellow-400">VERIFIED</span>
              </div>
              <div>
                <span className="text-yellow-400/60 text-[10px] block uppercase">SECURITY LEVEL</span>
                <span className="font-bold text-orange-400">SOC 2 TYPE II</span>
              </div>
            </div>

            {/* Verification Hash */}
            <div className="pt-2 border-t border-[#262626] space-y-1">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
                🔒 CRYPTOGRAPHIC PROOF HASH (SHA-256)
              </span>
              <p className="text-[10px] text-yellow-400/70 font-mono bg-[#121212] p-2 rounded border border-[#262626] break-all">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex items-center justify-between pt-4 border-t border-[#262626] text-[11px] font-mono">
            <div>
              <span className="text-yellow-400/60 text-[9px] block uppercase">APPROVED BY (CHIEF CONTROLLER)</span>
              <span className="font-bold text-yellow-400 uppercase">Priya Nair (Finance Manager)</span>
            </div>
            <div className="text-right">
              <span className="text-yellow-400/60 text-[9px] block uppercase">SYSTEM VERIFICATION AGENT</span>
              <span className="font-bold text-orange-400 uppercase">ReconX ML Core Engine v2.4</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 font-mono">
          <button
            onClick={onClose}
            className="rounded border border-[#262626] bg-[#121212] px-4 py-2 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase font-mono"
          >
            CANCEL
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded bg-orange-500 hover:bg-orange-400 px-5 py-2 text-xs font-bold text-black uppercase tracking-wider transition-colors shadow-lg font-mono"
          >
            <Printer className="w-4 h-4 text-black" />
            <span>PRINT / DOWNLOAD CERTIFICATE PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
