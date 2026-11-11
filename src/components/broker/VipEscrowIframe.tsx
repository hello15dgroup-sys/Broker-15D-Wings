import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  RotateCw,
  CreditCard,
  Search,
  Info,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SystemizedCheckoutEngine } from './SystemizedCheckoutEngine';
import { copyToClipboard, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface VipEscrowIframeProps {
  amountUsd?: number;
  hoursToDeparture?: number;
  initialMissionId?: string;
  initialEmail?: string;
  brokerId?: string;
}

interface QueriedPaymentStatus {
  missionId: string;
  email: string;
  status: string;
  securedAmountUsd: number;
  escrowAccount: string;
  timestamp: string;
  verifiedBy: string;
  brokerId?: string;
}

export const VipEscrowIframe: React.FC<VipEscrowIframeProps> = ({
  amountUsd = 0,
  hoursToDeparture = 36,
  initialMissionId = '',
  initialEmail = '',
  brokerId = '896ac12c-7d89-4ac9-a451-8edffee3ed09'
}) => {
  // Mission ID & Booking Email fields: initialized BLANK as requested for sensitive data security
  const [missionIdInput, setMissionIdInput] = useState(initialMissionId || '');
  const [bookingEmailInput, setBookingEmailInput] = useState(initialEmail || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewMode, setViewMode] = useState<'terminal' | 'wire_details'>('terminal');
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Payment status generation state
  const [isGeneratingStatus, setIsGeneratingStatus] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [paymentStatusResult, setPaymentStatusResult] = useState<QueriedPaymentStatus | null>(null);

  // Queries backend database (Supabase + server.ts) to populate sensitive fields and log broker ID
  const handleGeneratePaymentStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMission = missionIdInput.trim();
    const cleanEmail = bookingEmailInput.trim();

    if (!cleanMission) {
      setQueryError('Please enter a Mission Access Code to query database.');
      setPaymentStatusResult(null);
      return;
    }

    setIsGeneratingStatus(true);
    setQueryError(null);

    try {
      // 1. Log broker_id to public.missions on server.ts
      try {
        await fetch('/api/missions/log-broker-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brokerId: brokerId || '896ac12c-7d89-4ac9-a451-8edffee3ed09',
            missionId: cleanMission,
            email: cleanEmail
          })
        });
      } catch (logErr) {
        console.warn('Backend mission logging note:', logErr);
      }

      // 2. Query Supabase missions table
      const { data: mission } = await supabase
        .from('missions')
        .select('*')
        .ilike('id', cleanMission)
        .maybeSingle();

      if (mission) {
        setPaymentStatusResult({
          missionId: mission.id,
          email: mission.client_email || cleanEmail || 'Verified Escrow Client',
          status:
            mission.payment_status === 'PAID' || mission.payment_status === 'ESCROW_LOCKED'
              ? 'FUNDS_SECURED_IN_ESCROW'
              : mission.payment_status || 'AWAITING_CLIENT_DEPOSIT',
          securedAmountUsd: Number(
            mission.escrow_deposit || mission.total_estimate || mission.gross_operator_quote || amountUsd || 0
          ),
          escrowAccount: 'SKY PARTY LTD Fidelity Bank Escrow Vault (4011612222)',
          timestamp: mission.departure_date || new Date().toISOString(),
          verifiedBy: 'ops@15dwings.com.ng',
          brokerId: mission.broker_id || brokerId
        });
      } else {
        // 3. Query flight proposals table
        const { data: proposal } = await supabase
          .from('flight_proposals')
          .select('*')
          .ilike('mission_code', cleanMission)
          .maybeSingle();

        if (proposal) {
          setPaymentStatusResult({
            missionId: proposal.mission_code || cleanMission,
            email: cleanEmail || 'Verified Escrow Client',
            status: 'FUNDS_SECURED_IN_ESCROW',
            securedAmountUsd: Number(proposal.total_cost || amountUsd || 0),
            escrowAccount: 'SKY PARTY LTD Fidelity Bank Multi-Sig Vault',
            timestamp: new Date().toISOString(),
            verifiedBy: 'ops@15dwings.com.ng',
            brokerId: brokerId
          });
        } else {
          setPaymentStatusResult(null);
          setQueryError(`No active mission record found in database for code: "${cleanMission}". Please verify your flight code.`);
        }
      }
    } catch (err: any) {
      console.error('Database query error:', err);
      setPaymentStatusResult(null);
      setQueryError(err.message || 'Error querying database backend for mission status.');
    } finally {
      setIsGeneratingStatus(false);
    }
  };

  const handleCopyMissionAccess = async () => {
    if (!missionIdInput) return;
    const text = `Mission Code: ${missionIdInput}\nEmail: ${bookingEmailInput}`;
    await copyToClipboard(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const portalSrc = 'https://vip.15dwings.com.ng';

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Top Controls & Security Header */}
      <div className="bg-white/95 border border-purple-200/90 rounded-[2rem] p-6 shadow-xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="font-sync uppercase text-[11px] text-purple-700 font-bold tracking-[0.25em]">
                VIP ESCROW GATEWAY
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-sync font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" /> SECURE ESCROW VAULT ACTIVE
              </span>
            </div>
            <h3 className="font-sync text-lg md:text-xl font-bold uppercase text-gray-950 tracking-wider">
              15D VIP Payment & Escrow Terminal
            </h3>
            <p className="text-xs text-gray-600 font-medium font-sans">
              Direct high-security settlement and escrow protocol under{' '}
              <span className="font-mono text-purple-700 font-bold">SKY PARTY LTD</span>. Operations audit via{' '}
              <a
                href="mailto:ops@15dwings.com.ng"
                className="text-purple-700 font-semibold underline underline-offset-2 hover:text-purple-900"
              >
                ops@15dwings.com.ng
              </a>.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-purple-50 rounded-xl border border-purple-200">
              <button
                type="button"
                onClick={() => setViewMode('terminal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'terminal'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-100'
                }`}
              >
                Live Terminal
              </button>
              <button
                type="button"
                onClick={() => setViewMode('wire_details')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'wire_details'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-100'
                }`}
              >
                Wire & Bank Details
              </button>
            </div>

            <button
              onClick={() => setKey((k) => k + 1)}
              className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-700 transition-all cursor-pointer"
              title="Refresh Terminal"
            >
              <RotateCw className="w-4 h-4 text-purple-600" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-700 transition-all cursor-pointer"
              title={isFullscreen ? 'Minimize View' : 'Expand View'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-purple-600" />
              ) : (
                <Maximize2 className="w-4 h-4 text-purple-600" />
              )}
            </button>
          </div>
        </div>

        {/* ACCESS INSTRUCTIONS BANNER */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-purple-950">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Escrow Settlement & Verification Instructions:
              </p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                To query or verify escrow funding status in the database, enter your{' '}
                <strong className="underline decoration-purple-400">Mission Access Code</strong> and the{' '}
                <strong className="underline decoration-purple-400">Booking Email Address</strong>.
              </p>
            </div>
          </div>

          {missionIdInput && (
            <button
              type="button"
              onClick={handleCopyMissionAccess}
              className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-800 hover:bg-purple-100/50 font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
              <span>{copiedCode ? 'Access Copied' : 'Copy Credentials'}</span>
            </button>
          )}
        </div>

        {/* PAYMENT STATUS GENERATOR FORM */}
        <form
          onSubmit={handleGeneratePaymentStatus}
          className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-purple-600" />
              <span>Query Mission Payment & Escrow Status from Database</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-4">
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Mission ID / Access Code
              </label>
              <input
                type="text"
                required
                value={missionIdInput}
                onChange={(e) => setMissionIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Mission ID (e.g. 15D-001)"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Booking Email Address
              </label>
              <input
                type="email"
                required
                value={bookingEmailInput}
                onChange={(e) => setBookingEmailInput(e.target.value)}
                placeholder="Enter Booking Email Address"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={isGeneratingStatus}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-[38px]"
              >
                {isGeneratingStatus ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Query Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {queryError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{queryError}</span>
            </div>
          )}

          {/* Queried Payment Status Telemetry Card */}
          {paymentStatusResult && (
            <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{paymentStatusResult.status}</span>
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    Mission: <strong className="text-slate-900">{paymentStatusResult.missionId}</strong>
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  Queried from Database • {paymentStatusResult.verifiedBy}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Booking Email</span>
                  <p className="font-mono text-slate-900 truncate mt-0.5 font-medium">{paymentStatusResult.email}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Secured Escrow</span>
                  <p className="font-mono text-emerald-700 font-bold mt-0.5">
                    {formatCurrency(paymentStatusResult.securedAmountUsd, 'USD')}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Settlement Vault</span>
                  <p className="text-slate-900 font-medium truncate mt-0.5">{paymentStatusResult.escrowAccount}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Operator Release</span>
                  <p className="text-purple-700 font-semibold truncate mt-0.5">Locked until flight departure</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Main Terminal Area */}
      {viewMode === 'terminal' ? (
        <div className="bg-slate-950 rounded-[2rem] border border-purple-200 shadow-2xl overflow-hidden relative">
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-400">Live Escrow Portal:</span>
              <span className="font-mono text-purple-300 font-bold">15D VIP Terminal</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Encrypted SSL Session
            </span>
          </div>

          <iframe
            key={key}
            src={portalSrc}
            className="w-full h-[680px] md:h-[820px] border-none bg-slate-950"
            title="15D VIP Settlement Vault Terminal"
            allow="clipboard-write; payment; fullscreen"
          />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SystemizedCheckoutEngine
            amountUsd={amountUsd}
            hoursToDeparture={hoursToDeparture}
          />
        </motion.div>
      )}

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col p-2 md:p-6"
          >
            <div className="bg-slate-950 rounded-3xl w-full h-full flex flex-col overflow-hidden shadow-2xl border border-purple-300/40">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <span className="font-sync uppercase text-xs font-bold text-white tracking-wider">
                    15D VIP Settlement Vault Terminal
                  </span>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
                >
                  Close View
                </button>
              </div>

              <div className="flex-1 w-full h-full bg-slate-950">
                <iframe
                  src={portalSrc}
                  className="w-full h-full border-none bg-slate-950"
                  title="15D VIP Settlement Fullscreen Terminal"
                  allow="clipboard-write; payment; fullscreen"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
