import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, Activity, FileCheck, Fuel, Wrench, Users, Lock, ChevronRight, UserPlus, CreditCard } from 'lucide-react';

interface OperationalIntegrityIndexProps {
  missionId?: string;
  regionalQuotaCount?: number;
  regionalQuotaTarget?: number;
  daysInactive?: number;
}

export const OperationalIntegrityIndex: React.FC<OperationalIntegrityIndexProps> = ({
  missionId = '15D-001',
  regionalQuotaCount = 24,
  regionalQuotaTarget = 25,
  daysInactive = 14
}) => {
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [newAocName, setNewAocName] = useState('');
  const [newAocNumber, setNewAocNumber] = useState('');

  const isQuotaSatisfied = regionalQuotaCount >= regionalQuotaTarget;

  // 5 Operational Pillars status calculation
  const pillars = [
    { id: 'permits', name: 'Permits (NAMA / CAAs)', weight: 30, verified: true, timeGate: 'Hard Abort at T-72h/T-48h', icon: FileCheck },
    { id: 'fuel', name: 'Fuel Release Numbers (FRN)', weight: 20, verified: true, timeGate: 'Confirmed supplier delivery code', icon: Fuel },
    { id: 'aircraft', name: 'Aircraft CRS Mechanical Release', weight: 20, verified: true, timeGate: 'Tech Log signed off', icon: Wrench },
    { id: 'crew', name: 'Crew Physical Presence in City', weight: 15, verified: true, timeGate: 'Verified by T-12h', icon: Users },
    { id: 'payment', name: '15D Escrow Cleared Funds', weight: 15, verified: true, timeGate: 'Locked by T-48h', icon: Lock },
  ];

  const totalScore = pillars.reduce((sum, p) => (p.verified ? sum + p.weight : sum), 0);

  // Broker Activity State (60/90/120 Day Rule)
  let activityStatus: 'ACTIVE' | 'REMINDER_60' | 'SUSPENDED_90' | 'PURGE_120' = 'ACTIVE';
  if (daysInactive >= 120) activityStatus = 'PURGE_120';
  else if (daysInactive >= 90) activityStatus = 'SUSPENDED_90';
  else if (daysInactive >= 60) activityStatus = 'REMINDER_60';

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAocName || !newAocNumber) return;
    alert(`AOC Carrier "${newAocName}" (${newAocNumber}) submitted to ICC Desk for ground verification. Regional quota count updated!`);
    setShowOperatorModal(false);
    setNewAocName('');
    setNewAocNumber('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Operational Integrity Index Card */}
      <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#071318]/90 to-black/90">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
              <span className="font-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
                OPERATIONAL INTEGRITY INDEX (OII)
              </span>
            </div>
            <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-white uppercase">
              The 5 Pillars Verification Radar
            </h3>
            <p className="text-xs text-gray-400 font-light">
              Binary 100-point mission safety index. All pillars must hit 100% by T-120 minutes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-lexend text-[8px] text-gray-400 block tracking-widest">OII SCORE</span>
              <span className="text-2xl font-mono font-bold text-emerald-400">{totalScore} / 100</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 5 Pillars Progress Bar & Grid */}
        <div className="py-6 space-y-4">
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
            <div
              className="bg-gradient-to-r from-fbblue to-emerald-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${totalScore}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {pillars.map((p) => {
              const IconComp = p.icon;
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <IconComp className="w-4 h-4 text-fbblue" />
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">+{p.weight}%</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">{p.name}</h5>
                    <span className="text-[9px] text-gray-400 font-mono block mt-1">{p.timeGate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono pt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>VERIFIED</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Day Hard Gates Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-fbblue/10 border border-fbblue/30 flex items-start gap-3">
            <Clock className="w-5 h-5 text-fbblue shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-white uppercase font-sync">T-120 Minutes Hard Gate</h5>
              <p className="text-[11px] text-gray-300 font-light mt-0.5">
                All 5 Pillars must be 100% verified in system vault. Unverified items trigger automatic secondary asset pivot.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-400/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-white uppercase font-sync">ETD + 30 Minutes Hard Gate</h5>
              <p className="text-[11px] text-gray-300 font-light mt-0.5">
                If delayed past 30 minutes due to unverified tarmac excuses, auto-pivot triggers disengagement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Regional Gate & 60/90/120 Day Retention Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regional AOC Quota Gate */}
        <div className="p-6 rounded-[2rem] border border-white/10 glass-vip bg-black/80 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="font-lexend text-[9px] text-gray-400 tracking-widest block font-bold">
                REGIONAL SUPPLY DENSITY GATE
              </span>
              <h4 className="text-base font-bold text-white uppercase font-sync">
                Nigeria (+234) Regional Fleet
              </h4>
            </div>
            <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase ${isQuotaSatisfied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isQuotaSatisfied ? 'QUOTA SATISFIED' : 'GATE ACTIVE'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">Verified AOC Operators:</span>
              <span className="text-white font-bold">{regionalQuotaCount} / {regionalQuotaTarget} Airlines</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-fbblue h-full rounded-full transition-all"
                style={{ width: `${(regionalQuotaCount / regionalQuotaTarget) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Onboard 1 verified local AOC carrier to satisfy regional quota and unlock unlimited quotes.
            </p>
          </div>

          <button
            onClick={() => setShowOperatorModal(true)}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-fbblue" />
            <span>Onboard AOC Carrier (Sweat Equity)</span>
          </button>
        </div>

        {/* 60/90 Day Broker Lifecycle Status */}
        <div className="p-6 rounded-[2rem] border border-white/10 glass-vip bg-black/80 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="font-lexend text-[9px] text-fbblue tracking-widest block font-bold">
                BROKER ACTIVITY RETENTION ENGINE
              </span>
              <h4 className="text-base font-bold text-white uppercase font-sync">
                60/90-Day Activity Status
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold uppercase">
              {daysInactive} DAYS INACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-300 font-mono">
              <span>Current Clearance:</span>
              <span className="text-emerald-400 font-bold">ACTIVE BROKER</span>
            </div>
            <div className="flex justify-between text-gray-400 font-mono">
              <span>Next Check-In Threshold:</span>
              <span className="text-gray-300">60 Days (Reminder)</span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Keep tools free by onboarding a customer or booking a flight within 90 days.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowOperatorModal(true)}
              className="flex-1 py-3 rounded-xl bg-fbblue hover:bg-fbblue/90 text-white font-sync text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(24,119,242,0.4)]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Onboard Client</span>
            </button>

            <button
              onClick={() => setShowCreditsModal(true)}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 text-fbblue" />
              <span>Buy App Credits</span>
            </button>
          </div>
        </div>
      </div>

      {/* AOC Onboarding Modal */}
      {showOperatorModal && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-[10px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090e1a] rounded-3xl border border-white/20 p-6 space-y-5">
            <h4 className="text-lg font-bold text-white font-sync uppercase">Onboard AOC Operator</h4>
            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">AIRLINE / COMPANY NAME</label>
                <input
                  type="text"
                  required
                  value={newAocName}
                  onChange={(e) => setNewAocName(e.target.value)}
                  placeholder="e.g. Aero Contractors Charter"
                  className="w-full bg-black border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-lexend outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">AOC NUMBER</label>
                <input
                  type="text"
                  required
                  value={newAocNumber}
                  onChange={(e) => setNewAocNumber(e.target.value)}
                  placeholder="e.g. AOC/NG/109"
                  className="w-full bg-black border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-cyan-400 text-black font-bold text-xs font-sync uppercase hover:bg-cyan-300"
                >
                  Submit Carrier
                </button>
                <button
                  type="button"
                  onClick={() => setShowOperatorModal(false)}
                  className="px-4 py-3 rounded-xl bg-white/10 text-white text-xs font-mono"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* App Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-[10px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#090e1a] rounded-3xl border border-white/20 p-6 space-y-5 text-left">
            <h4 className="text-lg font-bold text-white font-sync uppercase">Buy App Credits</h4>
            <p className="text-xs text-gray-300 font-light">
              Pay-as-you-go proposal and booking access for dormant accounts or non-onboarding brokers.
            </p>

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-400/30 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-white">5 Flight Proposal Credits</span>
                <span className="text-[10px] text-gray-400 block font-mono">Unlock PDF exports & booking codes</span>
              </div>
              <span className="text-lg font-mono font-bold text-cyan-300">$150 USD</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert("App Credits package ($150 / 5 Credits) added to broker account balance.");
                  setShowCreditsModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-cyan-400 text-black font-bold text-xs font-sync uppercase hover:bg-cyan-300"
              >
                Purchase Credits ($150)
              </button>
              <button
                type="button"
                onClick={() => setShowCreditsModal(false)}
                className="px-4 py-3 rounded-xl bg-white/10 text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
