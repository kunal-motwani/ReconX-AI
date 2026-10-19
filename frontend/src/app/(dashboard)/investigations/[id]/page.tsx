'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SearchCheck,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldAlert,
  FileText,
  Calendar,
  Zap
} from 'lucide-react';
import { investigationApi } from '@/services/api';
import { Investigation } from '@/types';
import { formatDate, formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';

export default function InvestigationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inv, setInv] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    investigationApi
      .getById(params.id as string)
      .then(setInv)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdateStatus = async (status: string) => {
    if (!inv) return;
    setUpdating(true);
    try {
      const updated = await investigationApi.update(inv.id, { status });
      setInv(updated);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" label="RECONSTRUCTING AUDIT TIMELINE..." />;
  if (!inv) {
    return (
      <div className="p-8 text-center text-yellow-400 font-terminal">
        <p className="uppercase">Investigation record not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-xs text-orange-400 underline uppercase">
          Back to Case Register
        </button>
      </div>
    );
  }

  // Safely parse timeline if stored as JSON string or array
  let timeline: any[] = [];
  if (Array.isArray(inv.timeline)) {
    timeline = inv.timeline;
  } else if (typeof inv.timeline === 'string') {
    try {
      const parsed = JSON.parse(inv.timeline);
      if (Array.isArray(parsed)) timeline = parsed;
    } catch (e) {
      timeline = [];
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex items-center justify-between border-b border-[#262626] pb-4 font-mono">
        <div className="flex items-center gap-3">
          <Link
            href="/investigations"
            className="rounded-md p-1.5 text-orange-400 hover:bg-[#1a1a1a] transition-colors border border-[#262626]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-orange-500 flex items-center gap-2 uppercase tracking-wider">
              <SearchCheck className="w-5 h-5 text-orange-500" />
              CASE #{inv.id.substring(0, 8).toUpperCase()} // ROOT CAUSE ANALYSIS [F6]
            </h1>
            <p className="text-xs text-yellow-400/70 mt-0.5 font-sans">
              Assigned: {inv.assignedTo ? `${inv.assignedTo.firstName} ${inv.assignedTo.lastName}` : 'Finance Operations'} · {formatDateTime(inv.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <StatusBadge status={inv.status} />
          {inv.status !== 'APPROVED' && (
            <button
              onClick={() => handleUpdateStatus('APPROVED')}
              disabled={updating}
              className="rounded-md bg-orange-500 hover:bg-orange-400 px-3.5 py-1.5 text-xs font-bold text-black uppercase tracking-wider transition-colors"
            >
              Sign-Off & Approve [F7]
            </button>
          )}
        </div>
      </div>

      {/* Case Findings & Recommendation */}
      <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-4 font-terminal">
        <h2 className="text-xs font-bold text-orange-500 border-b border-[#262626] pb-2 uppercase tracking-widest font-mono">
          AUDIT FINDINGS & ROOT-CAUSE SUMMARY
        </h2>
        <p className="text-xs text-yellow-400/90 leading-relaxed font-sans">{inv.findings}</p>

        <div className="rounded-md bg-[#0a0a0a] p-4 border border-[#262626] space-y-1 font-mono">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            PRESCRIBED RECOMMENDATION:
          </span>
          <p className="text-xs text-yellow-400 font-sans">{inv.recommendation}</p>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bloomberg-panel rounded-md border border-[#262626] bg-[#121212] p-6 space-y-6 font-mono">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div>
            <h2 className="text-xs font-bold text-orange-500 uppercase tracking-wider">CHRONOLOGICAL AUDIT LIFECYCLE</h2>
            <p className="text-[11px] text-yellow-400/60 font-sans">Step-by-step transaction event reconstruction</p>
          </div>
          <span className="text-xs font-bold text-yellow-400 font-mono">[{timeline.length} SEQUENCED EVENTS]</span>
        </div>

        {timeline.length === 0 ? (
          <p className="text-xs text-yellow-400/60 py-4 text-center font-sans">No timeline steps recorded for this case.</p>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-orange-500/30">
            {timeline.map((event, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-orange-500 bg-[#0a0a0a] group-hover:scale-125 transition-transform" />
                <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yellow-400 uppercase">
                        Step {event.step || idx + 1}: {event.title || 'Audit Milestone'}
                      </span>
                      <span className="rounded bg-[#1c1c1c] border border-[#333333] px-1.5 py-0.2 text-[10px] text-orange-400 font-mono">
                        {event.actor || 'AI Agent'}
                      </span>
                    </div>
                    <span className="text-[11px] text-yellow-400/60 font-mono">
                      {event.timestamp ? formatDateTime(event.timestamp) : 'Recorded'}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-400/80 font-sans">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
