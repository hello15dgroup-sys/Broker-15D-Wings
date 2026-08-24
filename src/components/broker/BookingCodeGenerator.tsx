import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ShieldCheck, Check, Copy, UserCheck, RefreshCw, Send, Layers } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';

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

  const handleCopyIntakeLink = async () => {
    await copyToClipboard(vipIntakeUrl);
    setCopiedIntake(true);
    setTimeout(() => setCopiedIntake(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-purple-200 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0a1220]/90 to-black/90">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-space lowercase text-[9px] text-purple-600 tracking-[0.25em] font-bold lowercase">
              MODULE 3 & 4 — BOOKING CODE & 3-TIER EXECUTION
            </span>
          </div>
          <h3 className="font-space lowercase text-lg md:text-xl font-bold tracking-wider text-gray-900 lowercase">
            Issue Booking Code & AOC Carrier
          </h3>
          <p className="text-xs text-gray-600 font-light">
            Attach verified airline operator to release booking mission code & passenger intake link.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-purple-100 border border-purple-500/20 text-purple-600 text-[9px] font-mono tracking-wider lowercase font-semibold">
            {selectedOperator.tier.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {/* Left Column: AOC Selection & Tier Matrix */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-space lowercase text-[9px] text-gray-600 tracking-widest lowercase block">
              SELECT AIRLINE OPERATOR (AOC REGISTRY)
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md border border-purple-200 rounded-2xl px-4 py-3.5 text-xs text-gray-900 font-lexend focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              {SAMPLE_AOC_OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.companyName} [{op.tier === 'TIER_1_DIRECT' ? 'Tier 1 Direct' : op.tier === 'TIER_2_REPOSITIONING' ? 'Tier 2 Reposition' : 'Tier 3 Manual ICC'}]
                </option>
              ))}
            </select>
          </div>

          {/* 3-Tier Execution Matrix Info Box */}
          <div className="space-y-2 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200">
              <span className="font-space lowercase text-[9px] text-gray-600 lowercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" /> EXECUTION TIER MATRIX
              </span>
              <span className="font-mono text-purple-600 font-semibold">{selectedOperator.aocNumber}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-gray-700">
                <span className="text-[11px]">Assigned Aircraft:</span>
                <span className="font-mono font-bold text-gray-900">{selectedOperator.aircraftAvailable}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-[11px]">Primary Country:</span>
                <span className="font-mono text-gray-600">{selectedOperator.country}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-600/90 text-gray-900 font-space lowercase text-xs font-bold tracking-wider lowercase transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'GENERATING CODE...' : 'ISSUE NEW BOOKING CODE'}</span>
          </button>
        </div>

        {/* Right Column: Code & VIP Intake Link */}
        <div className="space-y-4 p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-200 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="font-space lowercase text-[9px] text-gray-600 tracking-widest lowercase block">
              OFFICIAL MISSION BOOKING CODE
            </span>
            <div className="p-4 rounded-xl bg-purple-100 border border-purple-500/30 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold tracking-wider text-purple-600">
                {missionCode}
              </span>
              <span className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-600 text-[9px] font-mono lowercase font-bold">
                LOCKED
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="font-space lowercase text-[9px] text-gray-600 tracking-widest lowercase block">
                VIP PASSENGER INTAKE LINK (FOR CLIENT)
              </label>
              <div className="p-3 rounded-xl bg-white border border-purple-200 text-xs font-mono text-gray-700 truncate">
                {vipIntakeUrl}
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                Send to client to collect passport documents, catering requests & ground transport.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyIntakeLink}
            className="w-full py-3.5 rounded-xl bg-purple-100 hover:bg-white/15 border border-purple-200 text-gray-900 font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {copiedIntake ? <Check className="w-4 h-4 text-purple-600" /> : <Send className="w-4 h-4 text-purple-600" />}
            <span>{copiedIntake ? 'Intake Link Copied!' : 'Copy Passenger Intake Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
