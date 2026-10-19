'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Terminal,
  Zap,
  ArrowRight,
  Cpu,
  ShieldCheck,
  Sparkles,
  Accessibility,
  Eye,
  Type,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  CheckCircle2,
  ScanLine,
  Keyboard,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDesignSystem } from '@/context/DesignSystemContext';
import { NeuralVectorRadar } from '@/components/dashboard/NeuralVectorRadar';
import { XRayMatchVisualizer } from '@/components/dashboard/XRayMatchVisualizer';

export default function HyperBloomExperiencePage() {
  const router = useRouter();
  const { login } = useAuth();
  const {
    theme,
    setTheme,
    dyslexiaMode,
    setDyslexiaMode,
    soundEnabled,
    setSoundEnabled,
    playSound,
  } = useDesignSystem();

  const [launching, setLaunching] = useState(false);
  const [compareMode, setCompareMode] = useState<'after' | 'before'>('after');

  const handleInstantTerminalLaunch = async (roleEmail = 'manager@abctech.com') => {
    playSound('scan');
    setLaunching(true);
    try {
      await login(roleEmail, 'Demo1234!');
      playSound('success');
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] terminal-grid-bg text-yellow-400 font-terminal selection:bg-orange-500/30 pb-20">
      {/* Sticky Top Navigation & Live Ergonomics Bar */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-md px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-orange-500 flex items-center justify-center text-black font-extrabold shadow-lg">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-widest text-orange-500 uppercase">
                RECONX // AI
              </span>
              <span className="rounded bg-orange-500/20 border border-orange-500/50 px-2 py-0.5 text-[9px] font-bold text-orange-400 uppercase">
                HYPERBLOOM UX EDITION
              </span>
            </div>
            <p className="text-[10px] text-yellow-400/60 hidden sm:block font-mono">
              TACTILE AUTONOMOUS FINANCIAL RECONCILIATION TERMINAL
            </p>
          </div>
        </div>

        {/* Live Accessibility Quick-Pills + Launch CTA */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => {
              playSound('click');
              setTheme(
                theme === 'TERMINAL_AMBER'
                  ? 'COLORBLIND_SAFE'
                  : theme === 'COLORBLIND_SAFE'
                  ? 'SWISS_PAPER'
                  : 'TERMINAL_AMBER'
              );
            }}
            className="hidden md:inline-flex items-center gap-1.5 rounded border border-[#333333] bg-[#121212] hover:border-orange-500 px-3 py-1.5 text-[11px] font-bold text-yellow-400 uppercase transition-all"
            title="Cycle Inclusive Visual Themes"
          >
            <Accessibility className="w-3.5 h-3.5 text-orange-500" />
            <span>
              THEME:{' '}
              {theme === 'TERMINAL_AMBER'
                ? 'AMBER OLED'
                : theme === 'COLORBLIND_SAFE'
                ? 'COLORBLIND CYAN'
                : 'SWISS PAPER'}
            </span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setDyslexiaMode(!dyslexiaMode);
            }}
            className={`hidden lg:inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-[11px] font-bold uppercase transition-all ${
              dyslexiaMode
                ? 'border-orange-400 bg-orange-500 text-black'
                : 'border-[#333333] bg-[#121212] text-yellow-400 hover:border-orange-500'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>DYSLEXIA FONT</span>
          </button>

          <button
            onClick={() => handleInstantTerminalLaunch('manager@abctech.com')}
            disabled={launching}
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-extrabold text-black uppercase tracking-wider shadow-lg transition-all"
          >
            <Zap className="w-4 h-4 fill-current text-black" />
            <span>{launching ? 'LAUNCHING...' : 'ENTER LIVE TERMINAL →'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 space-y-16">
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/50 bg-orange-950/40 px-3.5 py-1 text-[11px] font-bold text-orange-400 uppercase tracking-widest">
              <Award className="w-3.5 h-3.5 text-orange-500" />
              <span>RETHINKING FINANCIAL UX // ZERO-BLACK-BOX FINOPS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-yellow-400 leading-[1.12] uppercase">
              FROM 14 DAYS OF SPREADSHEET CHAOS TO{' '}
              <span className="text-orange-500 underline decoration-orange-500/40 underline-offset-8">
                30 SECONDS
              </span>{' '}
              OF TACTILE CLARITY.
            </h1>

            <p className="text-sm sm:text-base text-yellow-400/80 font-sans leading-relaxed max-w-2xl">
              Enterprise finance teams spend <strong>40% of every month</strong> manually cross-checking bank statement
              debits against vendor invoices. Legacy AI tools fail because they are opaque black boxes.{' '}
              <strong>ReconX-AI</strong> transforms reconciliation into a transparent, keyboard-driven, accessible
              visual experience powered by a 6-agent swarm.
            </p>

            {/* Primary CTA Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 font-mono">
              <button
                onClick={() => handleInstantTerminalLaunch('manager@abctech.com')}
                disabled={launching}
                className="inline-flex items-center gap-2.5 rounded-md bg-orange-500 hover:bg-orange-400 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-black uppercase tracking-wider shadow-2xl transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{launching ? 'INITIALIZING WORKSPACE...' : '1-CLICK LAUNCH TERMINAL (MANAGER)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/login"
                onClick={() => playSound('click')}
                className="inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#121212] hover:border-orange-500 px-5 py-3.5 text-xs font-bold text-yellow-400 uppercase tracking-wider transition-all"
              >
                <span>SWITCH ROLE PERSONA</span>
              </Link>
            </div>

            {/* Key UX Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#222222] font-mono">
              <div className="bg-[#121212] border border-[#262626] rounded p-3">
                <div className="text-xl font-extrabold text-orange-500">98.5%</div>
                <div className="text-[10px] text-yellow-400/70 uppercase mt-0.5">
                  5-FACTOR VECTOR PRECISION
                </div>
              </div>
              <div className="bg-[#121212] border border-[#262626] rounded p-3">
                <div className="text-xl font-extrabold text-yellow-400">F1–F10</div>
                <div className="text-[10px] text-yellow-400/70 uppercase mt-0.5">
                  ZERO-MOUSE HOTKEY FLOW
                </div>
              </div>
              <div className="bg-[#121212] border border-[#262626] rounded p-3">
                <div className="text-xl font-extrabold text-orange-400">AAA / ♿</div>
                <div className="text-[10px] text-yellow-400/70 uppercase mt-0.5">
                  COLORBLIND & DYSLEXIA SAFE
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Before vs After Cognitive Load Comparator */}
          <div className="lg:col-span-5 bloomberg-panel rounded-lg p-5 border border-[#262626] bg-[#121212] space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <span className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">
                UX PARADIGM SHIFT COMPARATOR
              </span>
              <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded border border-[#262626] text-[10px] font-bold">
                <button
                  onClick={() => {
                    playSound('click');
                    setCompareMode('before');
                  }}
                  className={`px-2.5 py-1 rounded uppercase transition-all ${
                    compareMode === 'before'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'text-yellow-400/60'
                  }`}
                >
                  OLD SPREADSHEET
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setCompareMode('after');
                  }}
                  className={`px-2.5 py-1 rounded uppercase transition-all ${
                    compareMode === 'after'
                      ? 'bg-orange-500 text-black'
                      : 'text-yellow-400/60'
                  }`}
                >
                  RECONX TERMINAL
                </button>
              </div>
            </div>

            {compareMode === 'before' ? (
              <div className="bg-[#0a0a0a] border border-red-900/50 rounded p-4 space-y-3 text-xs font-mono">
                <div className="text-red-400 font-bold uppercase flex items-center justify-between">
                  <span>❌ LEGACY MANUAL EXCEL / ERP</span>
                  <span>14 DAYS / MONTH</span>
                </div>
                <div className="space-y-2 text-[11px] text-yellow-400/70 font-sans">
                  <p>• Eye-straining white spreadsheets with 15,000+ unlinked rows.</p>
                  <p>• Exact VLOOKUP breaks when "AWS India" is billed as "NEFT-AWS CLOUD".</p>
                  <p>• ₹300 Section 194Q TDS tax deductions cause false-negative rejections.</p>
                  <p>• Zero explainability or cryptographic audit trail for statutory auditors.</p>
                </div>
                <div className="p-2.5 rounded bg-red-950/30 border border-red-900/60 text-[10px] text-red-300 font-mono">
                  ERROR_RATE: 4.2% // DUPLICATE_PAYMENTS_MISSED: ₹1.8L
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-orange-500/50 rounded p-4 space-y-3 text-xs font-mono">
                <div className="text-orange-400 font-bold uppercase flex items-center justify-between">
                  <span>⚡ RECONX TACTILE FINOPS TERMINAL</span>
                  <span>184ms LATENCY</span>
                </div>
                <div className="space-y-2 text-[11px] text-yellow-400/85 font-sans">
                  <p>✓ <strong>5-Factor Vector Radar</strong> pairs fuzzy vendor names & TDS tolerances automatically.</p>
                  <p>✓ <strong>X-Ray Laser Diff Loupe</strong> visually links invoice fields to bank UTR narrations.</p>
                  <p>✓ <strong>Inclusive A11Y Ergonomics</strong>: Okabe-Ito Colorblind mode, Swiss Paper & Dyslexia font.</p>
                  <p>✓ <strong>1-Click SOX 404 Certificate</strong> with immutable SHA-256 cryptographic hashes.</p>
                </div>
                <div className="p-2.5 rounded bg-orange-950/40 border border-orange-500/40 text-[10px] text-yellow-400 font-mono flex items-center justify-between">
                  <span>STATUS: 98.5% AUTO-SETTLED</span>
                  <span className="text-orange-400 font-bold">ZERO HALLUCINATIONS</span>
                </div>
              </div>
            )}

            <button
              onClick={() => handleInstantTerminalLaunch('manager@abctech.com')}
              className="w-full rounded bg-[#1c1c1c] hover:bg-orange-500 hover:text-black border border-[#333333] py-2.5 text-xs font-bold text-yellow-400 uppercase transition-all flex items-center justify-center gap-2"
            >
              <span>OPEN FULL COMMAND CENTER [F1]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* LIVE INTERACTIVE SANDBOX 1: 5-FACTOR VECTOR CONSTELLATION */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#262626] pb-3">
            <div>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block">
                INTERACTIVE PROTOTYPE SANDBOX 01 // CREATIVE INFORMATION ARCHITECTURE
              </span>
              <h2 className="text-xl font-extrabold text-yellow-400 uppercase mt-0.5">
                TRY THE LIVE 5-FACTOR VECTOR CONSTELLATION ENGINE
              </h2>
            </div>
            <span className="text-xs text-yellow-400/70 font-sans">
              Drag the sliders below to test how ReconX handles typos, TDS tax variances & settlement lag
            </span>
          </div>

          <NeuralVectorRadar />
        </section>

        {/* LIVE INTERACTIVE SANDBOX 2: X-RAY VISUAL DIFF LOUPE */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#262626] pb-3">
            <div>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block">
                INTERACTIVE PROTOTYPE SANDBOX 02 // EXPLAINABLE AI VISUALIZATION
              </span>
              <h2 className="text-xl font-extrabold text-yellow-400 uppercase mt-0.5">
                X-RAY CROSS-LEDGER LASER ALIGNMENT WORKBENCH
              </h2>
            </div>
            <span className="text-xs text-yellow-400/70 font-sans">
              Click any field node to inspect the mathematical proof and RAG accounting policy rule
            </span>
          </div>

          <XRayMatchVisualizer />
        </section>

        {/* INCLUSIVE ACCESSIBILITY & MULTI-SENSORY ERGONOMICS LAB (♿) */}
        <section className="bloomberg-panel rounded-lg p-6 border border-[#262626] bg-[#121212] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#262626] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-extrabold text-orange-500 uppercase tracking-wider">
                  ♿ INCLUSIVE ACCESSIBILITY & SENSORY ERGONOMICS ENGINE
                </h2>
              </div>
              <p className="text-xs text-yellow-400/75 font-sans mt-1">
                Designed so every financial analyst—including colorblind, neurodivergent, and low-vision operators—can reconcile with zero friction.
              </p>
            </div>
            <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 text-[10px] font-bold text-yellow-400 uppercase">
              TEST LIVE ON THIS PAGE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => {
                playSound('click');
                setTheme('TERMINAL_AMBER');
              }}
              className={`p-4 rounded-md border text-left transition-all space-y-2 ${
                theme === 'TERMINAL_AMBER'
                  ? 'border-orange-500 bg-orange-950/30'
                  : 'border-[#262626] bg-[#0a0a0a] hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Eye className="w-4 h-4 text-orange-500" />
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1c1c1c] text-orange-400">
                  DEFAULT OLED
                </span>
              </div>
              <div className="text-xs font-extrabold text-yellow-400 uppercase">
                1. BLOOMBERG AMBER
              </div>
              <p className="text-[11px] text-yellow-400/70 font-sans">
                Zero-glare #0a0a0a pitch-black background with high-luminance amber/yellow contrast for 10-hour close shifts.
              </p>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setTheme('COLORBLIND_SAFE');
              }}
              className={`p-4 rounded-md border text-left transition-all space-y-2 ${
                theme === 'COLORBLIND_SAFE'
                  ? 'border-orange-500 bg-orange-950/30'
                  : 'border-[#262626] bg-[#0a0a0a] hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Accessibility className="w-4 h-4 text-orange-500" />
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1c1c1c] text-yellow-400">
                  OKABE-ITO SAFE
                </span>
              </div>
              <div className="text-xs font-extrabold text-yellow-400 uppercase">
                2. DEUTERANOPIA SAFE
              </div>
              <p className="text-[11px] text-yellow-400/70 font-sans">
                Re-maps spectral channels to Electric Cyan & Solar Gold so red-green colorblind analysts never misread alerts.
              </p>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setTheme('SWISS_PAPER');
              }}
              className={`p-4 rounded-md border text-left transition-all space-y-2 ${
                theme === 'SWISS_PAPER'
                  ? 'border-orange-500 bg-orange-950/30'
                  : 'border-[#262626] bg-[#0a0a0a] hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Layers className="w-4 h-4 text-orange-500" />
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1c1c1c] text-yellow-400">
                  DAYLIGHT PRINT
                </span>
              </div>
              <div className="text-xs font-extrabold text-yellow-400 uppercase">
                3. SWISS PAPER LEDGER
              </div>
              <p className="text-[11px] text-yellow-400/70 font-sans">
                Warm archival ivory paper palette (#f4f1ea) with crisp ink borders for bright daylight office environments.
              </p>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setDyslexiaMode(!dyslexiaMode);
              }}
              className={`p-4 rounded-md border text-left transition-all space-y-2 ${
                dyslexiaMode
                  ? 'border-orange-500 bg-orange-950/30'
                  : 'border-[#262626] bg-[#0a0a0a] hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Type className="w-4 h-4 text-orange-500" />
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500 text-black">
                  {dyslexiaMode ? 'ACTIVE' : 'CLICK TO TOGGLE'}
                </span>
              </div>
              <div className="text-xs font-extrabold text-yellow-400 uppercase">
                4. DYSLEXIA HYPERLEGIBLE
              </div>
              <p className="text-[11px] text-yellow-400/70 font-sans">
                Expands letter tracking (+0.035em), word spacing, and switches to humanist sans-serif to prevent character crowding.
              </p>
            </button>
          </div>
        </section>

        {/* Bottom Final Call-to-Action Banner */}
        <section className="rounded-lg border-2 border-orange-500 bg-gradient-to-r from-[#141414] via-[#1c120c] to-[#141414] p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-yellow-400 uppercase tracking-wider">
            READY TO EXPERIENCE THE FULL 10-MODULE FINOPS TERMINAL?
          </h2>
          <p className="text-xs sm:text-sm text-yellow-400/80 font-sans max-w-xl mx-auto">
            Explore all 10 keyboard-driven modules (F1–F10), upload live datasets, inspect multi-agent reasoning traces, and print cryptographic SOX 404 certificates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleInstantTerminalLaunch('manager@abctech.com')}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-6 py-3 text-xs font-extrabold text-black uppercase tracking-wider shadow-xl transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>LAUNCH COMMAND TERMINAL [F1] →</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
