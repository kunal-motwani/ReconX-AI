'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Terminal, Zap, Keyboard } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useDesignSystem } from '@/context/DesignSystemContext';

interface HotkeyRoute {
  fKey: string;
  numKey: string;
  shortLabel: string;
  title: string;
  path: string;
}

const HOTKEY_ROUTES: HotkeyRoute[] = [
  { fKey: 'F1', numKey: '1', shortLabel: 'CMD', title: 'Command Dashboard', path: '/dashboard' },
  { fKey: 'F2', numKey: '2', shortLabel: 'DOCS', title: 'Document Upload Vault', path: '/documents?action=upload' },
  { fKey: 'F3', numKey: '3', shortLabel: 'LEDGER', title: 'General Ledger Feed', path: '/transactions' },
  { fKey: 'F4', numKey: '4', shortLabel: 'MATCH', title: 'Smart Matcher Engine', path: '/reconciliation' },
  { fKey: 'F5', numKey: '5', shortLabel: 'ANOMALY', title: 'Anomaly Control Center', path: '/anomalies' },
  { fKey: 'F6', numKey: '6', shortLabel: 'INVEST', title: 'Agent Investigations', path: '/investigations' },
  { fKey: 'F7', numKey: '7', shortLabel: 'APPROVE', title: 'Human Approval Queue', path: '/review' },
  { fKey: 'F8', numKey: '8', shortLabel: 'GL MAP', title: 'Chart of Accounts (GL)', path: '/gl-codes' },
  { fKey: 'F9', numKey: '9', shortLabel: 'REPORTS', title: 'Financial Reports', path: '/reports' },
  { fKey: 'F10', numKey: '0', shortLabel: 'AUDIT', title: 'System Audit Trail', path: '/audit-logs' },
];

export const KeyboardShortcuts: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { playSound } = useDesignSystem();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeHudToast, setActiveHudToast] = useState<string | null>(null);

  const triggerHotkeyNavigation = useCallback(
    (route: HotkeyRoute) => {
      playSound('hotkey');
      setActiveHudToast(`⚡ [${route.fKey}] EXECUTING → ${route.title.toUpperCase()}`);
      setIsHelpOpen(false);
      router.push(route.path);
      setTimeout(() => {
        setActiveHudToast(null);
      }, 2200);
    },
    [playSound, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const key = e.key;
      const code = e.code;

      // 1. Check Function Keys F1 - F10 (works even inside inputs, captured before browser default)
      const fMatch = HOTKEY_ROUTES.find(
        (r) => key.toUpperCase() === r.fKey || code.toUpperCase() === r.fKey
      );
      if (fMatch) {
        e.preventDefault();
        e.stopPropagation();
        triggerHotkeyNavigation(fMatch);
        return;
      }

      // 2. Check Alt + Number (1..9, 0) OR direct Number keys (1..9, 0) when NOT typing in an input
      if (!e.ctrlKey && !e.metaKey) {
        const numMatch = HOTKEY_ROUTES.find(
          (r) =>
            (e.altKey && (key === r.numKey || code === `Digit${r.numKey}`)) ||
            (!isInput && !e.shiftKey && key === r.numKey)
        );
        if (numMatch) {
          e.preventDefault();
          e.stopPropagation();
          triggerHotkeyNavigation(numMatch);
          return;
        }
      }

      // 3. Shift + ? or '/' -> Open Hotkey Guide Modal
      if (!isInput && (key === '?' || (key === '/' && e.shiftKey))) {
        e.preventDefault();
        playSound('click');
        setIsHelpOpen((prev) => !prev);
      }
    };

    // Use capture: true so we intercept F1, F3, F5, F6, F10 before browser chrome
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [triggerHotkeyNavigation, playSound]);

  return (
    <>
      {/* Live HUD Flash Toast when any Hotkey is pressed */}
      {activeHudToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-md border-2 border-orange-500 bg-[#0a0a0a]/95 px-4 py-2 text-xs font-extrabold text-yellow-400 shadow-2xl font-mono animate-in fade-in">
          <Zap className="w-4 h-4 text-orange-500 fill-current" />
          <span>{activeHudToast}</span>
        </div>
      )}

      {/* Interactive Hardware Function-Key Deck Dock at Bottom of Screen */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-md px-3 py-1.5 flex items-center justify-between gap-2 select-none font-mono">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {HOTKEY_ROUTES.map((r) => {
            const basePath = r.path.split('?')[0];
            const isActive = pathname === basePath || pathname?.startsWith(`${basePath}/`);
            return (
              <button
                key={r.fKey}
                type="button"
                onClick={() => triggerHotkeyNavigation(r)}
                title={`${r.title} — Press ${r.fKey}, Alt+${r.numKey}, or key '${r.numKey}'`}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold uppercase transition-all border flex-shrink-0 ${
                  isActive
                    ? 'bg-orange-500 text-black border-orange-400 shadow-md font-extrabold'
                    : 'bg-[#141414] text-yellow-400/85 border-[#262626] hover:border-orange-500 hover:text-yellow-400'
                }`}
              >
                <span
                  className={`px-1 rounded text-[9px] font-extrabold ${
                    isActive ? 'bg-black/20 text-black' : 'bg-[#0a0a0a] text-orange-400'
                  }`}
                >
                  {r.fKey}/{r.numKey}
                </span>
                <span>{r.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            setIsHelpOpen(true);
          }}
          className="flex items-center gap-1.5 rounded border border-orange-500/60 bg-orange-950/50 hover:bg-orange-500 hover:text-black px-2.5 py-1 text-[10px] font-extrabold text-orange-400 uppercase transition-colors flex-shrink-0"
          title="Open Interactive Hotkey Deck (Shift + ?)"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">HOTKEY MAP [?]</span>
        </button>
      </div>

      {/* Interactive Bloomberg Function Key Map Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="BLOOMBERG TERMINAL HOTKEY DECK"
        subtitle="Press Function Keys [F1–F10], Number Keys [1–0], or Click Any Module Below"
      >
        <div className="space-y-4 font-terminal text-xs">
          <div className="rounded bg-orange-950/40 border border-orange-500/40 p-2.5 text-[11px] text-yellow-400/90 font-sans">
            💡 <strong>Laptop Fn-Lock Bypass Enabled:</strong> You can press <strong>F1–F10</strong>,{' '}
            <strong>Alt + 1–0</strong>, OR simply press number keys <strong>1, 2, 3, 4, 5, 6, 7, 8, 9, 0</strong>{' '}
            directly on your keyboard (or click any button below) to jump instantly!
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {HOTKEY_ROUTES.map((r) => (
              <button
                key={r.fKey}
                type="button"
                onClick={() => triggerHotkeyNavigation(r)}
                className="flex items-center justify-between rounded border border-[#262626] bg-[#0a0a0a] hover:border-orange-500 hover:bg-[#161616] p-2.5 text-left transition-all group"
              >
                <span className="font-extrabold text-orange-400 group-hover:text-orange-300 font-mono">
                  [{r.fKey}] or Key [{r.numKey}]
                </span>
                <span className="text-yellow-400 font-bold">{r.title} →</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};
