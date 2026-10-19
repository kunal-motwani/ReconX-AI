'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles, Sliders, Cpu, CheckCircle2, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import { useDesignSystem } from '@/context/DesignSystemContext';

interface PresetCase {
  id: string;
  label: string;
  invoiceVendor: string;
  bankVendor: string;
  invoiceAmount: number;
  bankAmount: number;
  daysLag: number;
  refScore: number;
  descScore: number;
}

const PRESET_CASES: PresetCase[] = [
  {
    id: 'aws',
    label: 'AWS CLOUD #98124 (98.5%)',
    invoiceVendor: 'Amazon Web Services India Pvt Ltd',
    bankVendor: 'NEFT-AWS CLOUD INDIA PVT LTD',
    invoiceAmount: 147500,
    bankAmount: 147500,
    daysLag: 1,
    refScore: 0.98,
    descScore: 0.92,
  },
  {
    id: 'msft',
    label: 'MSFT AZURE #771 (TDS 194Q)',
    invoiceVendor: 'Microsoft Corporation (India) Pvt Ltd',
    bankVendor: 'RTGS-MICROSOFT INDIA CORP',
    invoiceAmount: 100300,
    bankAmount: 100000,
    daysLag: 1,
    refScore: 0.95,
    descScore: 0.89,
  },
  {
    id: 'slack',
    label: 'SLACK DUBLIN #4901 (96.8%)',
    invoiceVendor: 'Slack Technologies Limited',
    bankVendor: 'POS-SLACK TECHNOLOGIES DUBLIN',
    invoiceAmount: 36000,
    bankAmount: 36000,
    daysLag: 0,
    refScore: 0.96,
    descScore: 0.91,
  },
];

export const NeuralVectorRadar: React.FC = () => {
  const { playSound } = useDesignSystem();
  const [selectedPreset, setSelectedPreset] = useState<string>('aws');
  const [vendorFuzzSim, setVendorFuzzSim] = useState<number>(99);
  const [amountVarianceRs, setAmountVarianceRs] = useState<number>(0);
  const [dateLagDays, setDateLagDays] = useState<number>(1);
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  const activeCase = PRESET_CASES.find((c) => c.id === selectedPreset) || PRESET_CASES[0];

  const handleSelectPreset = (c: PresetCase) => {
    playSound('click');
    setSelectedPreset(c.id);
    if (c.id === 'aws') {
      setVendorFuzzSim(99);
      setAmountVarianceRs(0);
      setDateLagDays(1);
    } else if (c.id === 'msft') {
      setVendorFuzzSim(96);
      setAmountVarianceRs(300);
      setDateLagDays(1);
    } else {
      setVendorFuzzSim(97);
      setAmountVarianceRs(0);
      setDateLagDays(0);
    }
  };

  // Compute live 5-factor scores (0..1)
  const scores = useMemo(() => {
    const sVendor = vendorFuzzSim / 100;
    const diffPct = (Math.abs(amountVarianceRs) / activeCase.invoiceAmount) * 100;
    const sAmount = diffPct === 0 ? 1.0 : diffPct <= 1.5 ? Math.max(0.4, 1 - diffPct / 2.0) : Math.max(0.1, 1 - diffPct / 10);
    const sDate = dateLagDays <= 3 ? 1.0 : Math.max(0.15, 1 - (dateLagDays - 3) / 11);
    const sRef = activeCase.refScore;
    const sDesc = activeCase.descScore;

    const composite =
      sVendor * 0.35 +
      sAmount * 0.35 +
      sRef * 0.15 +
      sDate * 0.10 +
      sDesc * 0.05;

    return {
      vendor: sVendor,
      amount: sAmount,
      ref: sRef,
      date: sDate,
      desc: sDesc,
      composite: Math.min(1, Math.max(0, composite)),
    };
  }, [vendorFuzzSim, amountVarianceRs, dateLagDays, activeCase]);

  const axes = [
    { label: 'VENDOR SIM', weight: '35%', val: scores.vendor, detail: `Levenshtein Token-Set: ${Math.round(scores.vendor * 100)}%` },
    { label: 'AMOUNT EXACT', weight: '35%', val: scores.amount, detail: `Delta: ₹${amountVarianceRs} (${((amountVarianceRs / activeCase.invoiceAmount) * 100).toFixed(2)}%)` },
    { label: 'REFERENCE ID', weight: '15%', val: scores.ref, detail: `UTR Substring Sequence: ${Math.round(scores.ref * 100)}%` },
    { label: 'DATE DECAY', weight: '10%', val: scores.date, detail: `Settlement Delta: ${dateLagDays}d` },
    { label: 'NARRATION', weight: '5%', val: scores.desc, detail: `Cosine Context: ${Math.round(scores.desc * 100)}%` },
  ];

  // Radar SVG geometry (center 130, 125, radius 86)
  const cx = 135;
  const cy = 122;
  const maxR = 82;

  const getPoint = (idx: number, ratio: number) => {
    const angle = (Math.PI * 2 * idx) / 5 - Math.PI / 2;
    const r = maxR * ratio;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = axes
    .map((ax, i) => {
      const p = getPoint(i, ax.val);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  const compositePct = (scores.composite * 100).toFixed(1);
  const verdict =
    scores.composite >= 0.95
      ? { label: 'AUTO-SETTLE TO GL', color: 'text-yellow-400 border-yellow-500/60 bg-yellow-950/50' }
      : scores.composite >= 0.75
      ? { label: 'HUMAN SIGN-OFF [F7]', color: 'text-orange-400 border-orange-500/60 bg-orange-950/60' }
      : { label: 'ANOMALY ISOLATED [F5]', color: 'text-red-400 border-red-500/60 bg-red-950/60' };

  return (
    <div className="bloomberg-panel rounded-md p-5 border border-[#262626] bg-[#121212] relative overflow-hidden">
      {/* Subtle Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-600 via-yellow-400 to-orange-600 opacity-80" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#262626] pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-500 animate-pulse" />
            <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-widest font-mono">
              INTERACTIVE 5-FACTOR VECTOR CONSTELLATION & WHAT-IF SIMULATOR
            </h3>
            <span className="rounded bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[9px] font-bold text-orange-400 uppercase font-mono">
              LIVE SANDBOX
            </span>
          </div>
          <p className="text-[11px] text-yellow-400/70 mt-0.5 font-sans">
            Drag tolerance sliders or switch ledger pairs to inspect real-time vector geometry & decision thresholds
          </p>
        </div>

        {/* Preset Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          {PRESET_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectPreset(c)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                selectedPreset === c.id
                  ? 'bg-orange-500 text-black border-orange-400 shadow-md'
                  : 'bg-[#0a0a0a] text-yellow-400/80 border-[#262626] hover:border-orange-500/50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Custom Interactive SVG 5-Axis Radar Constellation */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-md border border-[#262626] p-3 relative">
          <svg
            viewBox="0 0 270 245"
            className="w-full max-w-[275px] h-auto select-none overflow-visible"
            role="img"
            aria-label="5-Factor Fuzzy Matching Vector Radar Chart"
          >
            <defs>
              <radialGradient id="vectorRadarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#facc15" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.04" />
              </radialGradient>
            </defs>

            {/* Concentric Calibration Pentagons */}
            {[0.25, 0.5, 0.75, 1.0].map((ring, rIdx) => {
              const ringPts = [0, 1, 2, 3, 4]
                .map((i) => {
                  const p = getPoint(i, ring);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={rIdx}
                  points={ringPts}
                  fill="none"
                  stroke={ring === 1.0 ? '#404040' : '#222222'}
                  strokeWidth={ring === 1.0 ? '1.2' : '0.8'}
                  strokeDasharray={ring === 0.75 ? '2,2' : undefined}
                />
              );
            })}

            {/* Axis Spokes */}
            {axes.map((ax, i) => {
              const end = getPoint(i, 1.0);
              const labelPt = getPoint(i, 1.24);
              const isHovered = hoveredAxis === i;
              return (
                <g key={i}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={end.x}
                    y2={end.y}
                    stroke={isHovered ? '#f97316' : '#2e2e2e'}
                    strokeWidth={isHovered ? '1.5' : '1'}
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-yellow-400 font-mono text-[8px] font-bold tracking-wider"
                  >
                    {ax.label} ({ax.weight})
                  </text>
                </g>
              );
            })}

            {/* Dynamic Morphed Vector Polygon */}
            <polygon
              points={polygonPoints}
              fill="url(#vectorRadarGlow)"
              stroke="#f97316"
              strokeWidth="2.2"
              className="transition-all duration-300 ease-out"
            />

            {/* Interactive Vertex Nodes */}
            {axes.map((ax, i) => {
              const pt = getPoint(i, ax.val);
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredAxis(i)}
                  onMouseLeave={() => setHoveredAxis(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    fill="#f97316"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#facc15"
                    stroke="#0a0a0a"
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}

            {/* Center Score Readout */}
            <circle cx={cx} cy={cy} r="22" fill="#0a0a0a" stroke="#333333" strokeWidth="1" />
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-orange-400 font-mono text-[10px] font-extrabold"
            >
              {compositePct}%
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-yellow-400/70 font-mono text-[6px] font-bold uppercase"
            >
              VECTOR
            </text>
          </svg>

          {/* Bottom Live Formula Strip */}
          <div className="w-full mt-1 pt-2 border-t border-[#1e1e1e] flex items-center justify-between text-[10px] font-mono">
            <span className="text-yellow-400/60">DECISION VERDICT:</span>
            <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${verdict.color}`}>
              {verdict.label}
            </span>
          </div>
        </div>

        {/* Right: Interactive What-If Sliders & Token Breakdown */}
        <div className="lg:col-span-7 space-y-4 font-mono">
          {/* Pair Comparison Pill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#0a0a0a] p-3 rounded border border-[#262626] text-xs">
            <div>
              <span className="text-[9px] text-orange-400 font-bold uppercase block">INVOICE ENTITY TOKEN</span>
              <span className="text-yellow-400 font-bold truncate block">{activeCase.invoiceVendor}</span>
              <span className="text-[10px] text-yellow-400/60">GROSS: ₹{activeCase.invoiceAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-[#262626] pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[9px] text-orange-400 font-bold uppercase block">BANK UTR NARRATION TOKEN</span>
              <span className="text-yellow-400 font-bold truncate block">{activeCase.bankVendor}</span>
              <span className="text-[10px] text-yellow-400/60">
                DEBIT: ₹{(activeCase.invoiceAmount - amountVarianceRs).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 3 Interactive Sliders */}
          <div className="space-y-3 bg-[#0a0a0a] p-3.5 rounded border border-[#262626]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                INTERACTIVE PARAMETER SENSITIVITY CONTROLS
              </span>
              <button
                onClick={() => handleSelectPreset(activeCase)}
                className="text-[10px] text-yellow-400/70 hover:text-orange-400 flex items-center gap-1 uppercase"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Slider 1: Vendor Token Similarity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="slider-vendor" className="text-yellow-400/90 font-bold">
                  1. VENDOR FUZZY TOKEN-SET SIMILARITY (Weight: 35%)
                </label>
                <span className="text-orange-400 font-extrabold">{vendorFuzzSim}%</span>
              </div>
              <input
                id="slider-vendor"
                type="range"
                min={30}
                max={100}
                value={vendorFuzzSim}
                onChange={(e) => setVendorFuzzSim(Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5 bg-[#1c1c1c] rounded cursor-pointer"
              />
            </div>

            {/* Slider 2: Amount Variance / TDS Deduction */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="slider-amount" className="text-yellow-400/90 font-bold">
                  2. AMOUNT / TDS WITHHOLDING VARIANCE (Weight: 35%)
                </label>
                <span className="text-orange-400 font-extrabold">
                  ₹{amountVarianceRs} ({((amountVarianceRs / activeCase.invoiceAmount) * 100).toFixed(2)}%)
                </span>
              </div>
              <input
                id="slider-amount"
                type="range"
                min={0}
                max={5000}
                step={50}
                value={amountVarianceRs}
                onChange={(e) => setAmountVarianceRs(Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5 bg-[#1c1c1c] rounded cursor-pointer"
              />
            </div>

            {/* Slider 3: Date Proximity Decay */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="slider-date" className="text-yellow-400/90 font-bold">
                  3. SETTLEMENT CLEARING LAG (Weight: 10%)
                </label>
                <span className="text-orange-400 font-extrabold">{dateLagDays} Days</span>
              </div>
              <input
                id="slider-date"
                type="range"
                min={0}
                max={14}
                value={dateLagDays}
                onChange={(e) => setDateLagDays(Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5 bg-[#1c1c1c] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 5-Dimension Live Score Pill Strip */}
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {axes.map((ax, i) => (
              <div
                key={i}
                className="rounded bg-[#0a0a0a] border border-[#262626] p-2 hover:border-orange-500/60 transition-colors"
              >
                <span className="text-[9px] text-yellow-400/60 block truncate">{ax.label}</span>
                <span className="text-xs font-extrabold text-orange-400">
                  {Math.round(ax.val * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
