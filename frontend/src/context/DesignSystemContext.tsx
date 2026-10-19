'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type VisualTheme = 'TERMINAL_AMBER' | 'COLORBLIND_SAFE' | 'SWISS_PAPER';

interface DesignSystemContextType {
  theme: VisualTheme;
  setTheme: (theme: VisualTheme) => void;
  dyslexiaMode: boolean;
  setDyslexiaMode: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  scanlinesEnabled: boolean;
  setScanlinesEnabled: (enabled: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isUxTourOpen: boolean;
  setIsUxTourOpen: (open: boolean) => void;
  playSound: (type: 'click' | 'success' | 'scan' | 'alert' | 'hotkey') => void;
}

const DesignSystemContext = createContext<DesignSystemContextType>({
  theme: 'TERMINAL_AMBER',
  setTheme: () => {},
  dyslexiaMode: false,
  setDyslexiaMode: () => {},
  soundEnabled: true,
  setSoundEnabled: () => {},
  scanlinesEnabled: true,
  setScanlinesEnabled: () => {},
  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: () => {},
  isUxTourOpen: false,
  setIsUxTourOpen: () => {},
  playSound: () => {},
});

export const DesignSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<VisualTheme>('TERMINAL_AMBER');
  const [dyslexiaMode, setDyslexiaState] = useState(false);
  const [soundEnabled, setSoundState] = useState(true);
  const [scanlinesEnabled, setScanlinesState] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUxTourOpen, setIsUxTourOpen] = useState(false);

  // Singleton AudioContext reference so browsers never hit the max-6 AudioContext limit
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef<boolean>(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('reconx_theme') as VisualTheme | null;
      if (savedTheme) setThemeState(savedTheme);
      const savedDys = localStorage.getItem('reconx_dyslexia');
      if (savedDys === 'true') setDyslexiaState(true);
      const savedSound = localStorage.getItem('reconx_sound');
      if (savedSound === 'false') {
        setSoundState(false);
        soundEnabledRef.current = false;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-reconx-theme', theme);
    root.setAttribute('data-dyslexia', dyslexiaMode ? 'true' : 'false');
    root.setAttribute('data-scanlines', scanlinesEnabled ? 'true' : 'false');
  }, [theme, dyslexiaMode, scanlinesEnabled]);

  const getOrCreateAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playSound = useCallback(
    (type: 'click' | 'success' | 'scan' | 'alert' | 'hotkey') => {
      if (!soundEnabledRef.current || typeof window === 'undefined') return;
      try {
        const ctx = getOrCreateAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        if (type === 'click') {
          // Crisp mechanical switch click (dual oscillator transient)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'hotkey') {
          // Futuristic Bloomberg terminal function-key double chirp
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(920, now);
          osc.frequency.setValueAtTime(1380, now + 0.045);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

          osc.start(now);
          osc.stop(now + 0.11);
        } else if (type === 'scan') {
          // Vector radar sweep sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(1240, now + 0.18);

          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'success') {
          // Rich harmonic two-note approval chime (D5 -> A5 -> D6)
          const notes = [587.33, 880, 1174.66];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            const startTime = now + idx * 0.065;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.24, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

            osc.start(startTime);
            osc.stop(startTime + 0.23);
          });
        } else if (type === 'alert') {
          // Low-frequency warning buzz
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.setValueAtTime(240, now + 0.09);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.start(now);
          osc.stop(now + 0.23);
        }
      } catch {
        // Ignore audio context restrictions
      }
    },
    []
  );

  const setTheme = (t: VisualTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem('reconx_theme', t);
    } catch {}
  };

  const setDyslexiaMode = (val: boolean) => {
    setDyslexiaState(val);
    try {
      localStorage.setItem('reconx_dyslexia', String(val));
    } catch {}
  };

  const setSoundEnabled = (val: boolean) => {
    soundEnabledRef.current = val;
    setSoundState(val);
    try {
      localStorage.setItem('reconx_sound', String(val));
    } catch {}
    if (val) {
      // Play an immediate confirmation chime when turning sound ON
      setTimeout(() => playSound('success'), 20);
    }
  };

  const setScanlinesEnabled = (val: boolean) => {
    setScanlinesState(val);
  };

  // Global listener: Every button, link, range slider, or F1-F10 / Ctrl+K key press across the entire app plays tactile audio!
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!soundEnabledRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, input[type="range"], select, [role="button"]');
      if (interactive) {
        playSound('click');
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playSound('hotkey');
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      // Play hotkey chirp on F1 - F10 keys
      if (/^F([1-9]|10)$/.test(e.key)) {
        playSound('hotkey');
      }
    };

    window.addEventListener('mousedown', handleGlobalClick, { passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [playSound]);

  return (
    <DesignSystemContext.Provider
      value={{
        theme,
        setTheme,
        dyslexiaMode,
        setDyslexiaMode,
        soundEnabled,
        setSoundEnabled,
        scanlinesEnabled,
        setScanlinesEnabled,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isUxTourOpen,
        setIsUxTourOpen,
        playSound,
      }}
    >
      {children}
    </DesignSystemContext.Provider>
  );
};

export const useDesignSystem = () => useContext(DesignSystemContext);
