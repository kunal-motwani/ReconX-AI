'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Play, Pause, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface StreamEvent {
  id: string;
  time: string;
  vendor: string;
  amount: number;
  type: 'INVOICE' | 'BANK_DEBIT';
  status: 'MATCHED' | 'PROCESSING' | 'VARIANCE_DETECTED';
  confidence: number;
}

export const LiveStreamTicker: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [events, setEvents] = useState<StreamEvent[]>([
    { id: 'ev-1', time: 'JUST NOW', vendor: 'Google Workspace India', amount: 14200, type: 'INVOICE', status: 'MATCHED', confidence: 0.98 },
    { id: 'ev-2', time: '2s ago', vendor: 'GitHub Enterprise Inc', amount: 36000, type: 'BANK_DEBIT', status: 'MATCHED', confidence: 0.99 },
    { id: 'ev-3', time: '5s ago', vendor: 'Amazon Web Services', amount: 100300, type: 'INVOICE', status: 'VARIANCE_DETECTED', confidence: 0.60 },
    { id: 'ev-4', time: '8s ago', vendor: 'Slack Technologies Inc', amount: 45000, type: 'INVOICE', status: 'MATCHED', confidence: 0.95 },
  ]);

  useEffect(() => {
    if (!isLive) return;

    const mockPool: Omit<StreamEvent, 'id' | 'time'>[] = [
      { vendor: 'Stripe Payments US', amount: 8920, type: 'BANK_DEBIT', status: 'MATCHED', confidence: 0.97 },
      { vendor: 'Zendesk SaaS Platform', amount: 24100, type: 'INVOICE', status: 'MATCHED', confidence: 0.99 },
      { vendor: 'Oracle Cloud Systems', amount: 145000, type: 'INVOICE', status: 'VARIANCE_DETECTED', confidence: 0.64 },
      { vendor: 'Notion Labs Corporate', amount: 5400, type: 'BANK_DEBIT', status: 'MATCHED', confidence: 0.98 },
      { vendor: 'Cloudflare Enterprise', amount: 18500, type: 'INVOICE', status: 'MATCHED', confidence: 0.96 },
    ];

    const interval = setInterval(() => {
      const randomEvent = mockPool[Math.floor(Math.random() * mockPool.length)];
      const newEvent: StreamEvent = {
        ...randomEvent,
        id: `ev-${Date.now()}`,
        time: 'JUST NOW',
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212] font-terminal text-yellow-400 space-y-3">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-orange-500' : 'bg-gray-500'}`} />
          </span>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
            REAL-TIME INGESTION & AGENT MATCHING STREAM
          </span>
        </div>

        <button
          onClick={() => setIsLive(!isLive)}
          className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-[#1c1c1c] border border-[#333333] px-2 py-0.5 rounded hover:border-orange-500 transition-colors uppercase font-mono"
        >
          {isLive ? <Pause className="w-3 h-3 text-orange-400" /> : <Play className="w-3 h-3 text-orange-400" />}
          <span>{isLive ? 'PAUSE LIVE STREAM' : 'RESUME STREAM'}</span>
        </button>
      </div>

      {/* Ticker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="rounded border border-[#262626] bg-[#0a0a0a] p-2.5 space-y-1 hover:border-orange-500/50 transition-all animate-in fade-in duration-300"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-yellow-400/60 font-bold">{ev.time}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  ev.status === 'MATCHED'
                    ? 'bg-yellow-950 text-yellow-400 border border-yellow-700'
                    : 'bg-orange-950 text-orange-400 border border-orange-800'
                }`}
              >
                {ev.status}
              </span>
            </div>
            <div className="font-bold text-yellow-400 truncate uppercase text-[11px]">{ev.vendor}</div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#262626]">
              <span className="text-orange-400 font-bold">{formatCurrency(ev.amount)}</span>
              <span className="text-yellow-400/80 font-bold">{Math.round(ev.confidence * 100)}% MATCH</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
