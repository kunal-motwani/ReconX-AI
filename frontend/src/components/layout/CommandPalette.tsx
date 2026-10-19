'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Terminal,
  Sparkles,
  Eye,
  Volume2,
  VolumeX,
  Type,
  Compass,
  Zap,
  ShieldCheck,
  FileText,
  GitCompare,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  Settings,
  ArrowRight,
  X,
  Award,
  Accessibility,
} from 'lucide-react';
import { useDesignSystem, VisualTheme } from '@/context/DesignSystemContext';

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const {
    theme,
    setTheme,
    dyslexiaMode,
    setDyslexiaMode,
    soundEnabled,
    setSoundEnabled,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isUxTourOpen,
    setIsUxTourOpen,
    playSound,
  } = useDesignSystem();

  const [query, setQuery] = useState('');
  const [tourStep, setTourStep] = useState(0);

  const commands = [
    {
      id: 'nav-f1',
      category: 'NAVIGATION [F1-F10]',
      title: '[F1] Command Center Terminal',
      subtitle: 'Executive KPIs, 5-Factor Vector Radar, Live Ticker & SOX Cert',
      icon: Terminal,
      action: () => router.push('/dashboard'),
    },
    {
      id: 'nav-f2',
      category: 'NAVIGATION [F1-F10]',
      title: '[F2] Document Vault & Multi-Modal OCR',
      subtitle: 'Ingest PDFs, CSV Bank Statements & 1-Click Judge Demo Presets',
      icon: FileText,
      action: () => router.push('/documents?action=upload'),
    },
    {
      id: 'nav-f4',
      category: 'NAVIGATION [F1-F10]',
      title: '[F4] Smart Matcher & X-Ray Diff Loupe',
      subtitle: '5-Factor Weighted Fuzzy Vector Matching & Laser Field Alignment',
      icon: GitCompare,
      action: () => router.push('/reconciliation'),
    },
    {
      id: 'nav-f5',
      category: 'NAVIGATION [F1-F10]',
      title: '[F5] Anomaly & Tax Variance Guard',
      subtitle: 'Inspect Section 194Q TDS discrepancies & duplicate payments',
      icon: AlertTriangle,
      action: () => router.push('/anomalies'),
    },
    {
      id: 'nav-f6',
      category: 'NAVIGATION [F1-F10]',
      title: '[F6] AI Root-Cause Investigations',
      subtitle: 'ChromaDB RAG policy retrieval & evidence timeline dossiers',
      icon: Compass,
      action: () => router.push('/investigations'),
    },
    {
      id: 'nav-f7',
      category: 'NAVIGATION [F1-F10]',
      title: '[F7] Human-in-the-Loop Approvals Queue',
      subtitle: '1-Click manager sign-off for partial matches & exceptions',
      icon: CheckSquare,
      action: () => router.push('/review'),
    },
    {
      id: 'nav-f8',
      category: 'NAVIGATION [F1-F10]',
      title: '[F8] Chart of Accounts (GL Mapping)',
      subtitle: '6-Stage deterministic-first General Ledger classification',
      icon: BookOpen,
      action: () => router.push('/gl-codes'),
    },
    {
      id: 'nav-f10',
      category: 'NAVIGATION [F1-F10]',
      title: '[F10] Immutable SHA-256 Audit Trail',
      subtitle: 'Cryptographic event log for SOX 404 & SOC 2 governance',
      icon: ShieldCheck,
      action: () => router.push('/audit-logs'),
    },
    {
      id: 'a11y-amber',
      category: 'ACCESSIBILITY & VISUAL ERGONOMICS (♿)',
      title: 'Theme: Bloomberg High-Contrast Amber',
      subtitle: 'Pitch-black (#0a0a0a) zero-glare OLED terminal palette',
      icon: Eye,
      action: () => setTheme('TERMINAL_AMBER'),
    },
    {
      id: 'a11y-cb',
      category: 'ACCESSIBILITY & VISUAL ERGONOMICS (♿)',
      title: 'Theme: Deuteranopia / Protanopia Safe (Okabe-Ito Cyan)',
      subtitle: 'Scientifically calibrated colorblind-safe high-contrast palette',
      icon: Accessibility,
      action: () => setTheme('COLORBLIND_SAFE'),
    },
    {
      id: 'a11y-paper',
      category: 'ACCESSIBILITY & VISUAL ERGONOMICS (♿)',
      title: 'Theme: Swiss Archival Daylight Paper Ledger',
      subtitle: 'Warm ivory paper (#f4f1ea) & international orange ink for bright rooms',
      icon: Eye,
      action: () => setTheme('SWISS_PAPER'),
    },
    {
      id: 'a11y-dyslexia',
      category: 'ACCESSIBILITY & VISUAL ERGONOMICS (♿)',
      title: `Toggle Dyslexia-Friendly Hyperlegible Typography (${dyslexiaMode ? 'ON' : 'OFF'})`,
      subtitle: 'Wide letter tracking, increased line-height, and humanist sans-serif',
      icon: Type,
      action: () => setDyslexiaMode(!dyslexiaMode),
    },
    {
      id: 'a11y-sound',
      category: 'ACCESSIBILITY & VISUAL ERGONOMICS (♿)',
      title: `Toggle Tactile Web Audio Micro-Acoustics (${soundEnabled ? 'ON' : 'OFF'})`,
      subtitle: 'Synthesized mechanical terminal clicks & vector scan confirmation chimes',
      icon: soundEnabled ? Volume2 : VolumeX,
      action: () => setSoundEnabled(!soundEnabled),
    },
    {
      id: 'ux-tour',
      category: 'HYPERBLOOM OCTOBER SHOWCASE',
      title: 'Launch Interactive HyperBloom UX & Architecture Tour',
      subtitle: '6-Pillar walkthrough of UX flows, Accessibility, and Visual Innovation',
      icon: Sparkles,
      action: () => setIsUxTourOpen(true),
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const TOUR_SLIDES = [
    {
      badge: 'PILLAR 1 // 🧭 THOUGHTFUL UX & USER FLOWS',
      title: 'Zero-Mouse Financial Velocity (F1–F10 + Ctrl+K)',
      body: 'Enterprise financial controllers reconcile thousands of lines under extreme time pressure. Every screen in ReconX-AI is reachable via hardware function keys (F1–F10) and the Ctrl+K Command Palette — reducing a 14-day manual spreadsheet workflow into a 30-second keyboard-driven flow.',
      ctaLabel: 'Explore Smart Matcher [F4]',
      ctaAction: () => {
        setIsUxTourOpen(false);
        router.push('/reconciliation');
      },
    },
    {
      badge: 'PILLAR 2 // 🎨 INTUITIVE & VISUALLY COMPELLING UI',
      title: 'Interactive 5-Factor Vector Constellation & X-Ray Loupe',
      body: 'Instead of opaque "black-box" AI scores, we designed bespoke interactive SVG data visualizations: a live 5-Axis Vector Radar with sensitivity sliders and an X-Ray Laser Diff Workbench that visually connects Source Invoice fields to Bank UTR narrations.',
      ctaLabel: 'Test Vector Radar on Dashboard [F1]',
      ctaAction: () => {
        setIsUxTourOpen(false);
        router.push('/dashboard');
      },
    },
    {
      badge: 'PILLAR 3 // ♿ ACCESSIBILITY & INCLUSIVE DESIGN',
      title: 'Multi-Sensory & Neuro-Inclusive Financial Ergonomics',
      body: 'Financial terminals are notoriously inaccessible. ReconX-AI pioneers an inclusive FinOps Ergonomics Engine: 1-click Okabe-Ito Colorblind-Safe Cyan/Gold mode, a Daylight Swiss Paper Ledger mode, Dyslexia-Friendly Hyperlegible typography, and Web Audio synthesized tactile feedback.',
      ctaLabel: 'Try Colorblind-Safe Mode Now',
      ctaAction: () => {
        setTheme(theme === 'COLORBLIND_SAFE' ? 'TERMINAL_AMBER' : 'COLORBLIND_SAFE');
      },
    },
    {
      badge: 'PILLAR 4 // 💡 PROBLEM-SOLVING & ORIGINALITY',
      title: 'Explainable Chain-of-Thought + Cryptographic SOX 404 Proofs',
      body: 'CFOs refuse to adopt AI that hallucinates numbers. ReconX-AI isolates math to deterministic Levenshtein & Date-Decay algorithms, exposes the full JSON execution graph in [AI TRACE], and stamps every approved match with a printable SHA-256 SOX Compliance Certificate.',
      ctaLabel: 'Inspect Document Vault [F2]',
      ctaAction: () => {
        setIsUxTourOpen(false);
        router.push('/documents?action=upload');
      },
    },
  ];

  return (
    <>
      {/* 1. Ctrl+K Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-20 p-4 font-terminal"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-orange-500/60 bg-[#121212] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 border-b border-[#262626] bg-[#0a0a0a] px-4 py-3.5">
              <Search className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="TYPE A COMMAND, MODULE [F1-F10], OR ACCESSIBILITY MODE..."
                className="w-full bg-transparent text-xs font-mono text-yellow-400 placeholder-yellow-400/40 focus:outline-none uppercase"
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="rounded border border-[#333333] px-2 py-0.5 text-[10px] font-mono text-yellow-400/70 hover:text-orange-400"
              >
                ESC
              </button>
            </div>

            {/* Command List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#1e1e1e] p-2">
              {filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      playSound('click');
                      cmd.action();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-md hover:bg-[#1c1c1c] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded bg-[#0a0a0a] border border-[#282828] group-hover:border-orange-500 flex items-center justify-center text-orange-400 flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[9px] font-mono font-bold text-orange-500 uppercase tracking-widest">
                          {cmd.category}
                        </span>
                        <span className="block text-xs font-mono font-bold text-yellow-400 truncate">
                          {cmd.title}
                        </span>
                        <span className="block text-[11px] font-sans text-yellow-400/60 truncate">
                          {cmd.subtitle}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-yellow-400/40 group-hover:text-orange-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-[#262626] bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between text-[10px] font-mono text-yellow-400/60">
              <span>PRO TIP: PRESS CTRL+K ANYTIME TO OPEN OMNI-COMMAND</span>
              <span className="text-orange-400 font-bold">HYPERBLOOM UX EDITION</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive HyperBloom Judge UX Walkthrough Modal */}
      {isUxTourOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-terminal"
          onClick={() => setIsUxTourOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-lg border-2 border-orange-500 bg-[#121212] p-6 shadow-2xl space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-extrabold text-orange-500 uppercase tracking-widest font-mono">
                  HYPERBLOOM OCTOBER // UX & DESIGN ARCHITECTURE TOUR
                </span>
              </div>
              <button
                onClick={() => setIsUxTourOpen(false)}
                className="text-yellow-400/60 hover:text-orange-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-3 bg-[#0a0a0a] p-5 rounded-md border border-[#262626]">
              <span className="inline-block rounded bg-orange-500/20 border border-orange-500/40 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 font-mono uppercase">
                {TOUR_SLIDES[tourStep].badge}
              </span>
              <h2 className="text-lg font-extrabold text-yellow-400 font-mono">
                {TOUR_SLIDES[tourStep].title}
              </h2>
              <p className="text-xs text-yellow-400/85 leading-relaxed font-sans">
                {TOUR_SLIDES[tourStep].body}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    playSound('success');
                    TOUR_SLIDES[tourStep].ctaAction();
                  }}
                  className="inline-flex items-center gap-2 rounded bg-orange-500 hover:bg-orange-400 px-3.5 py-1.5 text-xs font-bold text-black uppercase font-mono transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{TOUR_SLIDES[tourStep].ctaLabel}</span>
                </button>
              </div>
            </div>

            {/* Progress Dots & Controls */}
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                {TOUR_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playSound('click');
                      setTourStep(idx);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      idx === tourStep ? 'w-7 bg-orange-500' : 'w-2 bg-[#333333]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={tourStep === 0}
                  onClick={() => {
                    playSound('click');
                    setTourStep((s) => Math.max(0, s - 1));
                  }}
                  className="px-3 py-1.5 rounded border border-[#333333] text-yellow-400 disabled:opacity-30 uppercase"
                >
                  Prev
                </button>
                {tourStep < TOUR_SLIDES.length - 1 ? (
                  <button
                    onClick={() => {
                      playSound('click');
                      setTourStep((s) => s + 1);
                    }}
                    className="px-4 py-1.5 rounded bg-orange-500 text-black font-bold uppercase"
                  >
                    Next Pillar →
                  </button>
                ) : (
                  <button
                    onClick={() => setIsUxTourOpen(false)}
                    className="px-4 py-1.5 rounded bg-yellow-400 text-black font-bold uppercase"
                  >
                    Finish Tour ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
