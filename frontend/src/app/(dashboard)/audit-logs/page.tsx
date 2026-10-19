'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, User } from 'lucide-react';
import { auditApi } from '@/services/api';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditApi.list({
        entity: entityFilter || undefined
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
              IMMUTABLE AUDIT TRAIL [F10]
            </h1>
            <span className="rounded bg-yellow-950 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-700 uppercase">
              SOC 2 / SOX COMPLIANT
            </span>
          </div>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Complete security and operations log of all document uploads, ledger modifications, and human sign-offs
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-[#121212] p-3 rounded-md border border-[#262626] font-mono text-xs">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 uppercase font-mono"
        >
          <option value="">ALL ENTITIES</option>
          <option value="Document">DOCUMENT</option>
          <option value="Transaction">TRANSACTION</option>
          <option value="Reconciliation">RECONCILIATION</option>
          <option value="Anomaly">ANOMALY</option>
          <option value="Investigation">INVESTIGATION</option>
          <option value="GLCode">GL CODE</option>
          <option value="User">USER</option>
        </select>

        <span className="text-xs text-yellow-400 font-bold uppercase">
          {logs.length} RECORDED EVENTS
        </span>
      </div>

      {loading ? (
        <LoadingSpinner label="QUERYING IMMUTABLE AUDIT LEDGER..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit logs recorded"
          description="Actions performed in the system will automatically appear here."
        />
      ) : (
        <div className="bloomberg-panel rounded-md overflow-hidden border border-[#262626] bg-[#121212]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#262626] bg-[#0a0a0a] text-orange-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">TIMESTAMP</th>
                  <th className="px-4 py-3">ACTION</th>
                  <th className="px-4 py-3">ENTITY</th>
                  <th className="px-4 py-3">ENTITY ID</th>
                  <th className="px-4 py-3">USER</th>
                  <th className="px-4 py-3">DETAILS / DELTA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-yellow-400">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3.5 text-yellow-400/80 whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-orange-400">
                      <span className="rounded bg-[#1c1c1c] border border-orange-500/40 px-2 py-0.5 text-[10px] text-orange-400 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-yellow-400 font-bold uppercase">{log.entity}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-orange-400 truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3.5 text-yellow-400 uppercase">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : <span className="text-yellow-400/50">SYSTEM AGENT</span>}
                    </td>
                    <td className="px-4 py-3.5 text-yellow-400/70 font-mono text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.newValue || log.previousValue || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
