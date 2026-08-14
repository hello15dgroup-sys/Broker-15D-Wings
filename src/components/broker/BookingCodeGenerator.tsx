import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ShieldCheck, Check, Copy, UserCheck, RefreshCw, Send, Layers } from 'lucide-react';

export interface AOCRuleOperator {
  id: string;
  companyName: string;
  aocNumber: string;
  country: string;
  tier: 'TIER_1_DIRECT' | 'TIER_2_REPOSITIONING' | 'TIER_3_ICC_DESK';
  aircraftAvailable: string;
}

export const SAMPLE_AOC_OPERATORS: AOCRuleOperator[] = [
  { id: 'aoc-01', companyName: 'Air Peace Executive (AOC #AP-2024)', aocNumber: 'AOC/NG/089', country: 'Nigeria', tier: 'TIER_1_DIRECT', aircraftAvailable: 'Hawker 900XP / Dornier 328' },
  { id: 'aoc-02', companyName: 'Max Air Charter (AOC #MA-044)', aocNumber: 'AOC/NG/044', country: 'Nigeria', tier: 'TIER_1_DIRECT', aircraftAvailable: 'Challenger 604' },
  { id: 'aoc-03', companyName: 'Westminster Jets UK (Adjacent Zone)', aocNumber: 'AOC/UK/771', country: 'United Kingdom', tier: 'TIER_2_REPOSITIONING', aircraftAvailable: 'Global 6000 (+Ferry Fee)' },
  { id: 'aoc-04', companyName: '15D ICC Desk Manual Dispatch', aocNumber: 'ICC-OFF-HAND', country: 'Global', tier: 'TIER_3_ICC_DESK', aircraftAvailable: 'Bespoke Sourcing' },
];

interface BookingCodeGeneratorProps {
  currentMissionId?: string;
  onCodeGenerated?: (code: string, operator: AOCRuleOperator) => void;
}

export const BookingCodeGenerator: React.FC<BookingCodeGeneratorProps> = ({
  currentMissionId = '15D-001',
  onCodeGenerated
}) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('aoc-01');
  const [missionCode, setMissionCode] = useState<string>(currentMissionId);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedIntake, setCopiedIntake] = useState<boolean>(false);

  const selectedOperator = SAMPLE_AOC_OPERATORS.find(op => op.id === selectedOperatorId) || SAMPLE_AOC_OPERATORS[0];
  const vipIntakeUrl = `https://15dwings.com.ng/portal?missionId=${missionCode}&verified=true`;

  const handleGenerateCode = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomNum = Math.floor(100 + Math.random() * 899);
      const newCode = `15D-${randomNum}`;
      setMissionCode(newCode);
      setIsGenerating(false);
      if (onCodeGenerated) {
        onCodeGenerated(newCode, selectedOperator);
      }
    }, 600);
  };

  const handleCopyIntakeLink = () => {
    navigator.clipboard.writeText(vipIntakeUrl);
    setCopiedIntake(true);
    setTimeout(() => setCopiedIntake(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0a1220]/90 to-black/90">
      <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
            <span className="font-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
              MODULE 3 & 4 — BOOKING CODE & 3-TIER EXECUTION
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-white uppercase">
            Issue Booking Code & AOC Carrier
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Attach verified airline operator to release booking mission code & passenger intake link.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-fbblue/10 border border-fbblue/20 text-fbblue text-[9px] font-mono tracking-wider uppercase font-semibold">
            {selectedOperator.tier.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {/* Left Column: AOC Selection & Tier Matrix */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block">
              SELECT AIRLINE OPERATOR (AOC REGISTRY)
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="w-full bg-black/80 border border-white/15 rounded-2xl px-4 py-3.5 text-xs text-white font-lexend focus:border-fbblue outline-none transition-all cursor-pointer"
            >
              {SAMPLE_AOC_OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.companyName} [{op.tier === 'TIER_1_DIRECT' ? 'Tier 1 Direct' : op.tier === 'TIER_2_REPOSITIONING' ? 'Tier 2 Reposition' : 'Tier 3 Manual ICC'}]
                </option>
              ))}
            </select>
          </div>

          {/* 3-Tier Execution Matrix Info Box */}
          <div className="space-y-2 p-4 rounded-2xl bg-black/60 border border-white/10 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-sync text-[9px] text-gray-400 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-fbblue" /> EXECUTION TIER MATRIX
              </span>
              <span className="font-mono text-fbblue font-semibold">{selectedOperator.aocNumber}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-gray-300">
                <span className="text-[11px]">Assigned Aircraft:</span>
                <span className="font-mono font-bold text-white">{selectedOperator.aircraftAvailable}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="text-[11px]">Primary Country:</span>
                <span className="font-mono text-gray-400">{selectedOperator.country}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-fbblue hover:bg-fbblue/90 text-white font-sync text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'GENERATING CODE...' : 'ISSUE NEW BOOKING CODE'}</span>
          </button>
        </div>

        {/* Right Column: Code & VIP Intake Link */}
        <div className="space-y-4 p-6 rounded-2xl bg-black/70 border border-white/15 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block">
              OFFICIAL MISSION BOOKING CODE
            </span>
            <div className="p-4 rounded-xl bg-fbblue/10 border border-fbblue/30 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold tracking-wider text-fbblue">
                {missionCode}
              </span>
              <span className="px-2.5 py-1 rounded bg-fbblue/20 text-fbblue text-[9px] font-mono uppercase font-bold">
                LOCKED
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block">
                VIP PASSENGER INTAKE LINK (FOR CLIENT)
              </label>
              <div className="p-3 rounded-xl bg-black border border-white/10 text-xs font-mono text-gray-300 truncate">
                {vipIntakeUrl}
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                Send to client to collect passport documents, catering requests & ground transport.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyIntakeLink}
            className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {copiedIntake ? <Check className="w-4 h-4 text-fbblue" /> : <Send className="w-4 h-4 text-fbblue" />}
            <span>{copiedIntake ? 'Intake Link Copied!' : 'Copy Passenger Intake Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
