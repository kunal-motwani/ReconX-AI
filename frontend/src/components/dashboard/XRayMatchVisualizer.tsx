'use client';

import React, { useState } from 'react';
import { ScanLine, CheckCircle2, AlertTriangle, Sparkles, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import { useDesignSystem } from '@/context/DesignSystemContext';

interface FieldBeam {
  id: string;
  label: string;
  leftTitle: string;
  leftVal: string;
  rightTitle: string;
  rightVal: string;
  score: string;
  status: 'EXACT' | 'FUZZY_MATCH' | 'TDS_VARIANCE';
  mathFormula: string;
  explanation: string;
  yCoord: number;
}

const BEAMS: FieldBeam[] = [
  {
    id: 'vendor',
    label: 'TOKEN-SET RATIO (0.99)',
    leftTitle: 'INVOICE VENDOR ENTITY',
    leftVal: 'Microsoft Corporation (India) Pvt Ltd',
    rightTitle: 'BANK STATEMENT NARRATION',
    rightVal: 'RTGS-MICROSOFT INDIA CORP',
    score: '99%',
    status: 'FUZZY_MATCH',
    mathFormula: 'fuzz.token_set_ratio("microsoft india", "rtgs microsoft india corp") = 0.99',
    explanation:
      'Normalizer stripped legal suffixes (Pvt Ltd, Corporation) and banking prefixes (RTGS-) before computing Levenshtein token intersection.',
    yCoord: 38,
  },
  {
    id: 'amount',
    label: 'SEC 194Q TDS DELTA (₹300)',
    leftTitle: 'INVOICE GROSS TOTAL',
    leftVal: '₹1,00,300.00 (Incl. 18% GST)',
    rightTitle: 'HDFC BANK DEBIT AMOUNT',
    rightVal: '₹1,00,000.00 (Net Cleared)',
    score: '94%',
    status: 'TDS_VARIANCE',
    mathFormula: '|100300 - 100000| / 100300 = 0.299% (< 1.0% Statutory Tolerance)',
    explanation:
      'RAG Policy Engine matched the ₹300.00 difference to statutory 0.1% Section 194Q TDS withholding + ₹150 RTGS clearing fee.',
    yCoord: 98,
  },
  {
    id: 'reference',
    label: 'SUBSTRING HASH (0.96)',
    leftTitle: 'TAX INVOICE NUMBER',
    leftVal: 'MSFT-AZ-2026-771',
    rightTitle: 'BANK UTR MEMO STRING',
    rightVal: 'UTR-7710092 // MSFT-AZ-2026-771',
    score: '96%',
    status: 'EXACT',
    mathFormula: 'SequenceMatcher("MSFT-AZ-2026-771", memo).find_longest_match() = 16 chars',
    explanation:
      'Extracted exact 16-character invoice identifier embedded inside unstructured 48-character NEFT/RTGS bank remittance narration.',
    yCoord: 158,
  },
  {
    id: 'date',
    label: 'CLEARING LAG (+1 DAY)',
    leftTitle: 'INVOICE ISSUE DATE',
    leftVal: '04 Oct 2026 (14:20 IST)',
    rightTitle: 'BANK SETTLEMENT VALUE DATE',
    rightVal: '05 Oct 2026 (09:15 IST)',
    score: '100%',
    status: 'EXACT',
    mathFormula: 'Δt = |t_bank - t_inv| = 1d ≤ 3d Grace Window → Score = 1.00',
    explanation:
      'T+1 banking settlement cycle falls well within the 3-business-day zero-penalty proximity window.',
    yCoord: 218,
  },
];

export const XRayMatchVisualizer: React.FC = () => {
  const { playSound } = useDesignSystem();
  const [selectedBeamId, setSelectedBeamId] = useState<string>('amount');

  const activeBeam = BEAMS.find((b) => b.id === selectedBeamId) || BEAMS[1];

  return (
    <div className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] space-y-4 font-terminal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-widest font-mono">
              X-RAY VISUAL DIFF LOUPE // CROSS-LEDGER VECTOR ALIGNMENT
            </h3>
            <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 text-[9px] font-bold text-yellow-400 uppercase font-mono">
              CLICK ANY NODE TO INSPECT
            </span>
          </div>
          <p className="text-[11px] text-yellow-400/70 mt-0.5 font-sans">
            Interactive neural field linkage between Source Vendor Invoice (Left) and Counterparty Bank UTR (Right)
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#262626] text-yellow-400">
            COMPOSITE: <strong className="text-orange-400">94.2%</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-orange-950/70 border border-orange-700 text-orange-400 font-bold">
            TDS 194Q DETECTED
          </span>
        </div>
      </div>

      {/* 3-Column X-Ray Split Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-2 items-center bg-[#0a0a0a] p-4 rounded-md border border-[#262626]">
        {/* Left Column: Source Invoice Fields */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider border-b border-[#262626] pb-1.5 flex items-center justify-between font-mono">
            <span>📄 SOURCE: VENDOR INVOICE</span>
            <span className="text-yellow-400/60">OCR: 99.2%</span>
          </div>
          {BEAMS.map((b) => {
            const isSelected = b.id === selectedBeamId;
            return (
              <button
                key={b.id}
                onClick={() => {
                  playSound('click');
                  setSelectedBeamId(b.id);
                }}
                className={`w-full text-left p-2.5 rounded border transition-all font-mono ${
                  isSelected
                    ? 'border-orange-500 bg-orange-950/30 shadow-md'
                    : 'border-[#222222] bg-[#121212] hover:border-orange-500/40'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-yellow-400/60 uppercase">
                  <span>{b.leftTitle}</span>
                  <span className="text-orange-400 font-bold">{b.score}</span>
                </div>
                <div className="text-xs font-bold text-yellow-400 truncate mt-0.5">{b.leftVal}</div>
              </button>
            );
          })}
        </div>

        {/* Center Column: Animated SVG Bezier Laser Connectors */}
        <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-center h-full">
          <svg
            viewBox="0 0 220 256"
            className="w-full h-[256px] overflow-visible select-none"
            aria-label="Vector connection beams between invoice and bank statement"
          >
            {BEAMS.map((b) => {
              const isSelected = b.id === selectedBeamId;
              const strokeColor =
                b.status === 'TDS_VARIANCE'
                  ? '#f97316'
                  : '#facc15';
              const pathD = `M 4 ${b.yCoord} C 85 ${b.yCoord}, 135 ${b.yCoord}, 216 ${b.yCoord}`;

              return (
                <g
                  key={b.id}
                  onClick={() => {
                    playSound('click');
                    setSelectedBeamId(b.id);
                  }}
                  className="cursor-pointer"
                >
                  {/* Base Glow Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '5' : '1.5'}
                    strokeOpacity={isSelected ? '0.25' : '0.2'}
                  />
                  {/* Animated Pulse Dash Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '2.2' : '1.2'}
                    strokeDasharray={isSelected ? '6,4' : '3,3'}
                  />
                  {/* Left & Right Terminal Anchor Dots */}
                  <circle cx={4} cy={b.yCoord} r={isSelected ? 4.5 : 3} fill={strokeColor} />
                  <circle cx={216} cy={b.yCoord} r={isSelected ? 4.5 : 3} fill={strokeColor} />

                  {/* Center Pill Badge */}
                  <rect
                    x={36}
                    y={b.yCoord - 10}
                    width={148}
                    height={20}
                    rx={3}
                    fill={isSelected ? '#f97316' : '#141414'}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '1.5' : '0.8'}
                  />
                  <text
                    x={110}
                    y={b.yCoord + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-mono text-[8px] font-extrabold ${
                      isSelected ? 'fill-black' : 'fill-yellow-400'
                    }`}
                  >
                    {b.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Column: Target Bank Statement Fields */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider border-b border-[#262626] pb-1.5 flex items-center justify-between font-mono">
            <span>🏦 COUNTERPARTY: HDFC BANK UTR</span>
            <span className="text-yellow-400/60">FEED: LIVE</span>
          </div>
          {BEAMS.map((b) => {
            const isSelected = b.id === selectedBeamId;
            return (
              <button
                key={b.id}
                onClick={() => {
                  playSound('click');
                  setSelectedBeamId(b.id);
                }}
                className={`w-full text-left p-2.5 rounded border transition-all font-mono ${
                  isSelected
                    ? 'border-orange-500 bg-orange-950/30 shadow-md'
                    : 'border-[#222222] bg-[#121212] hover:border-orange-500/40'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-yellow-400/60 uppercase">
                  <span>{b.rightTitle}</span>
                  <span
                    className={`font-bold ${
                      b.status === 'TDS_VARIANCE' ? 'text-orange-400' : 'text-yellow-400'
                    }`}
                  >
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs font-bold text-yellow-400 truncate mt-0.5">{b.rightVal}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Inspector Bar for Active Beam */}
      <div className="rounded-md border border-orange-500/40 bg-[#0a0a0a] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500 text-black">
              ACTIVE VECTOR: {activeBeam.id.toUpperCase()}
            </span>
            <code className="text-[11px] text-orange-400 font-bold">{activeBeam.mathFormula}</code>
          </div>
          <p className="text-xs text-yellow-400/85 font-sans">{activeBeam.explanation}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-bold text-yellow-400 uppercase">RAG POLICY VERIFIED</span>
        </div>
      </div>
    </div>
  );
};
