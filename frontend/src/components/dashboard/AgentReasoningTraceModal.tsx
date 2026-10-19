'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Cpu, CheckCircle2, ShieldCheck, Zap, GitBranch, Terminal, ArrowRight, Code } from 'lucide-react';

interface AgentStep {
  id: string;
  agentName: string;
  role: string;
  status: 'COMPLETED' | 'RUNNING' | 'PENDING';
  latencyMs: number;
  confidence: number;
  outputSummary: string;
  rawPayload: Record<string, any>;
}

export const AgentReasoningTraceModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-2');

  const agents: AgentStep[] = [
    {
      id: 'agent-1',
      agentName: 'DocExtractAgent v2.4',
      role: 'Multi-Modal Ingestion & Structuring',
      status: 'COMPLETED',
      latencyMs: 142,
      confidence: 0.985,
      outputSummary: 'Parsed PDF tables into normalized JSON ledger format with 98.5% confidence score.',
      rawPayload: {
        vendorName: 'Amazon Web Services (AWS)',
        invoiceNumber: 'AWS-IN-2026-9812',
        lineItemsCount: 14,
        totalAmount: 100300,
        currency: 'INR',
        taxIdentification: '27AAACA4231N1Z5',
        ocrConfidence: 0.985
      }
    },
    {
      id: 'agent-2',
      agentName: 'WeightedMatcherAgent',
      role: '5-Factor Fuzzy Vector Scoring',
      status: 'COMPLETED',
      latencyMs: 89,
      confidence: 0.942,
      outputSummary: 'Calculated composite match score across Vendor, Reference, Date, Amount, and Currency vector space.',
      rawPayload: {
        vendorFuzzyMatchScore: 0.99,
        dateProximityDays: 1,
        dateMatchScore: 0.95,
        referenceMatchScore: 0.88,
        amountDifference: 300,
        compositeConfidenceScore: 0.942,
        prescribedAction: 'RECOMMEND_HUMAN_SIGN_OFF'
      }
    },
    {
      id: 'agent-3',
      agentName: 'AnomalyGuardAgent',
      role: 'Outlier & Duplicate Detection',
      status: 'COMPLETED',
      latencyMs: 64,
      confidence: 0.991,
      outputSummary: 'Flagged variance of ₹300. Evaluated 0.1% TDS withholding heuristic under Section 194Q.',
      rawPayload: {
        varianceDetected: 300,
        expectedTdsPercentage: 0.001,
        ruleEngineVerdict: 'TDS_WITHHOLDING_VARIANCE',
        duplicateCheckStatus: 'CLEAR',
        riskLevel: 'LOW'
      }
    },
    {
      id: 'agent-4',
      agentName: 'AuditLedgerAgent',
      role: 'Immutable Hash & State Logging',
      status: 'COMPLETED',
      latencyMs: 31,
      confidence: 1.0,
      outputSummary: 'Cryptographically logged state transition and generated SOX/SOC 2 compliance proof.',
      rawPayload: {
        eventHash: '0x8f2a991b8d27e4e112a901ff98234ab1c2d3e4f5',
        previousState: 'UNMATCHED',
        newState: 'REVIEW_REQUIRED',
        stateTimestamp: new Date().toISOString()
      }
    }
  ];

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI MULTI-AGENT REASONING TRACE // CHAIN OF THOUGHT"
      subtitle="Inspect autonomous sub-agent execution graphs, vector match weights, and decision payloads"
      maxWidth="2xl"
    >
      <div className="space-y-5 font-mono text-yellow-400">
        {/* Execution Flow Diagram */}
        <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-4">
          <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">
            ⚡ AUTONOMOUS AGENT PIPELINE EXECUTION GRAPH
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {agents.map((ag, idx) => {
              const isSelected = ag.id === selectedAgentId;
              return (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgentId(ag.id)}
                  className={`rounded p-2 text-left border transition-all text-xs ${
                    isSelected
                      ? 'border-orange-500 bg-orange-950/60 text-yellow-400 font-bold'
                      : 'border-[#262626] bg-[#121212] hover:border-orange-500/50 text-yellow-400/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-orange-400 font-bold">#0{idx + 1}</span>
                    <span className="text-yellow-400 text-[9px] bg-[#1c1c1c] px-1 py-0.2 rounded">
                      {ag.latencyMs}ms
                    </span>
                  </div>
                  <div className="font-bold uppercase text-[11px] truncate">{ag.agentName.split(' ')[0]}</div>
                  <div className="text-[9px] text-yellow-400/60 line-clamp-1">{ag.role}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Agent Deep Dive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Summary Box */}
          <div className="md:col-span-1 bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212] space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-orange-400 uppercase truncate">
                {selectedAgent.agentName}
              </span>
            </div>
            <div className="text-[11px] space-y-2 divide-y divide-[#262626]">
              <div className="py-1">
                <span className="text-yellow-400/60 text-[10px] block uppercase">ROLE</span>
                <span className="font-bold text-yellow-400">{selectedAgent.role}</span>
              </div>
              <div className="py-1">
                <span className="text-yellow-400/60 text-[10px] block uppercase">EXECUTION LATENCY</span>
                <span className="font-bold text-orange-400">{selectedAgent.latencyMs} ms</span>
              </div>
              <div className="py-1">
                <span className="text-yellow-400/60 text-[10px] block uppercase">CONFIDENCE SCORE</span>
                <span className="font-bold text-yellow-400">
                  {Math.round(selectedAgent.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Raw Payload Inspector */}
          <div className="md:col-span-2 bloomberg-panel rounded-md p-4 border border-[#262626] bg-[#121212] space-y-2">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-orange-500" /> AGENT OUTPUT PAYLOAD
              </span>
              <span className="text-[10px] text-yellow-400 bg-yellow-950 px-2 py-0.5 rounded border border-yellow-700 font-bold uppercase">
                VALIDATED
              </span>
            </div>
            <p className="text-xs text-yellow-400/90 font-sans">{selectedAgent.outputSummary}</p>

            <div className="rounded bg-[#0a0a0a] p-3 border border-[#262626] text-[11px] text-yellow-400 font-mono overflow-x-auto max-h-48">
              <pre>{JSON.stringify(selectedAgent.rawPayload, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded bg-orange-500 hover:bg-orange-400 px-5 py-2 text-xs font-bold text-black uppercase tracking-wider transition-colors"
          >
            CLOSE REASONING TRACE
          </button>
        </div>
      </div>
    </Modal>
  );
};
