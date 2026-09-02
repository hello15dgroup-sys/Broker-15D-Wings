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
  const vipIntakeUrl = `https://vip.15dwings.com.ng/portal?missionId=${missionCode}&verified=true`;

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
    <div className="p-6 md:p-8 rounded-[2rem] border border-purple-200 shadow-xl relative overflow-hidden bg-white text-left">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-sync text-[10px] text-purple-700 tracking-[0.25em] font-bold uppercase">
              CLIENT BOOKING LINK & AOC EXECUTION
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-gray-950 uppercase">
            Issue Booking Code & Passenger Intake Link
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Attach verified airline carrier to release client intake link and booking mission code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-300 text-purple-800 text-[10px] font-sync tracking-wider uppercase font-bold">
            {selectedOperator.tier.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {/* Left Column: AOC Selection & Tier Matrix */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-sync text-[10px] font-bold text-gray-700 tracking-wider uppercase block">
              SELECT AIRLINE OPERATOR (AOC REGISTRY)
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-2xl px-4 py-3.5 text-xs text-gray-900 font-semibold focus:border-purple-500 outline-none transition-all cursor-pointer shadow-sm"
            >
              {SAMPLE_AOC_OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.companyName} [{op.tier === 'TIER_1_DIRECT' ? 'Tier 1 Direct' : op.tier === 'TIER_2_REPOSITIONING' ? 'Tier 2 Reposition' : 'Tier 3 Manual ICC'}]
                </option>
              ))}
            </select>
          </div>

          {/* 3-Tier Execution Matrix Info Box */}
          <div className="space-y-2 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200">
              <span className="font-sync text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" /> EXECUTION TIER MATRIX
              </span>
              <span className="font-mono text-purple-700 font-bold">{selectedOperator.aocNumber}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-gray-700">
                <span className="text-[11px] font-medium">Assigned Aircraft:</span>
                <span className="font-mono font-bold text-gray-900">{selectedOperator.aircraftAvailable}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-[11px] font-medium">Primary Country:</span>
                <span className="font-mono text-gray-700 font-semibold">{selectedOperator.country}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sync text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'GENERATING CODE...' : 'ISSUE NEW BOOKING CODE'}</span>
          </button>
        </div>

        {/* Right Column: Code & VIP Intake Link */}
        <div className="space-y-4 p-6 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="font-sync text-[10px] font-bold text-gray-700 tracking-wider uppercase block">
              OFFICIAL MISSION BOOKING CODE
            </span>
            <div className="p-4 rounded-xl bg-white border border-purple-300 flex items-center justify-between shadow-sm">
              <span className="font-mono text-2xl font-bold tracking-wider text-purple-700">
                {missionCode}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-sync uppercase font-bold border border-purple-200">
                VERIFIED
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="font-sync text-[10px] font-bold text-gray-700 tracking-wider uppercase block">
                VIP PASSENGER INTAKE LINK (FOR CLIENT)
              </label>
              <div className="p-3 rounded-xl bg-white border border-purple-200 text-xs font-mono text-gray-900 font-semibold truncate shadow-sm">
                {vipIntakeUrl}
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                Send to client to collect passport documents, catering requests & ground transport.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleCopyIntakeLink}
              className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sync text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer"
            >
              {copiedIntake ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{copiedIntake ? 'Intake Link Copied!' : 'Copy Passenger Intake Link'}</span>
            </button>
            <a
              href={vipIntakeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 font-sync text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              title="Preview Intake Portal"
            >
              <span>OPEN</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
