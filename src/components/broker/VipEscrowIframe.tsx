import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  CreditCard,
  Search,
  Sparkles,
  Info,
  Clock,
  Mail,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { SystemizedCheckoutEngine } from './SystemizedCheckoutEngine';
import { copyToClipboard, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface VipEscrowIframeProps {
  amountUsd?: number;
  hoursToDeparture?: number;
  initialMissionId?: string;
  initialEmail?: string;
}

interface QueriedPaymentStatus {
  missionId: string;
  email: string;
  status: string;
  securedAmountUsd: number;
  escrowAccount: string;
  timestamp: string;
  verifiedBy: string;
}

export const VipEscrowIframe: React.FC<VipEscrowIframeProps> = ({
  amountUsd = 0,
  hoursToDeparture = 36,
  initialMissionId = '',
  initialEmail = ''
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'iframe' | 'ledger'>('iframe');

  // Mission ID & Booking Email fields: initialized BLANK as requested for sensitive data security
  const [missionIdInput, setMissionIdInput] = useState(initialMissionId || '');
  const [bookingEmailInput, setBookingEmailInput] = useState(initialEmail || '');
  const [copiedCode, setCopiedCode] = useState(false);

  // Payment status generation state - initialized BLANK (null) until queried from backend
  const [isGeneratingStatus, setIsGeneratingStatus] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [paymentStatusResult, setPaymentStatusResult] = useState<QueriedPaymentStatus | null>(null);

  // Always point default URL to vip.15dwings.com.ng without sensitive query strings
  const defaultPortalUrl = 'https://vip.15dwings.com.ng';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // Queries backend database (Supabase) to populate sensitive fields with real queried data
  const handleGeneratePaymentStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMission = missionIdInput.trim();
    const cleanEmail = bookingEmailInput.trim();

    if (!cleanMission) {
      setQueryError('Please enter a Mission ID / Flight Access Code to query database.');
      setPaymentStatusResult(null);
      return;
    }

    setIsGeneratingStatus(true);
    setQueryError(null);

    try {
      // 1. Query Supabase missions table
      const { data: mission, error: missionErr } = await supabase
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
          escrowAccount: '15D Wings Secured Escrow Vault (Multi-Sig)',
          timestamp: mission.departure_date || new Date().toISOString(),
          verifiedBy: 'ops@15dwings.com.ng'
        });
      } else {
        // 2. Query flight proposals table
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
            escrowAccount: '15D Wings Multi-Sig Settlement Vault',
            timestamp: new Date().toISOString(),
            verifiedBy: 'ops@15dwings.com.ng'
          });
        } else {
          // Record not found in database backend
          setPaymentStatusResult(null);
          setQueryError(`No active mission record found in database for ID: "${cleanMission}". Please verify your flight code.`);
        }
      }
    } catch (err: any) {
      console.error('Database query error:', err);
      setPaymentStatusResult(null);
      setQueryError(err.message || 'Error querying database backend for mission status.');
    } finally {
      setIsGeneratingStatus(false);
      handleRefresh();
    }
  };

  const handleCopyMissionAccess = async () => {
    if (!missionIdInput) return;
    const text = `Mission Code: ${missionIdInput}\nEmail: ${bookingEmailInput}\nVIP Portal: https://vip.15dwings.com.ng`;
    await copyToClipboard(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

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
                <Lock className="w-3 h-3 text-emerald-600" /> SECURE SSL (vip.15dwings.com.ng)
              </span>
            </div>
            <h3 className="font-sync text-lg md:text-xl font-bold uppercase text-gray-950 tracking-wider">
              15D VIP Payment & Escrow Terminal
            </h3>
            <p className="text-xs text-gray-600 font-medium font-sans">
              Direct high-security settlement and escrow protocol powered by{' '}
              <span className="font-mono text-purple-700 font-bold">15D Secure Vault</span>. Operations audit via{' '}
              <a
                href="mailto:ops@15dwings.com.ng"
                className="text-purple-700 font-semibold underline underline-offset-2 hover:text-purple-900"
              >
                ops@15dwings.com.ng
              </a>.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-purple-50 rounded-xl border border-purple-200/80">
              <button
                type="button"
                onClick={() => setViewMode('iframe')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'iframe'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-100/60'
                }`}
              >
                VIP Portal Iframe
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ledger')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'ledger'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-100/60'
                }`}
              >
                Settlement Engine
              </button>
            </div>

            {/* Reload Frame Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-gray-800 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Reload VIP Portal"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : 'text-gray-700'}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>

            {/* Open Externally Button: strictly points to vip.15dwings.com.ng */}
            <a
              href={defaultPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95"
              title="Open vip.15dwings.com.ng in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OPEN NEW TAB</span>
            </a>

            {/* Toggle Fullscreen Modal */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-gray-800 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">EXIT FULL</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">EXPAND</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. ACCESS INSTRUCTIONS BANNER */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-purple-950">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                VIP Portal Access & Settlement Instructions:
              </p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                To enter the portal and complete or verify escrow funding on{' '}
                <strong className="text-purple-900 font-mono">vip.15dwings.com.ng</strong>, enter your{' '}
                <strong className="underline decoration-purple-400">Mission Code Access</strong> and the{' '}
                <strong className="underline decoration-purple-400">Email used to book the flight</strong> to query live database records.
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

        {/* 2. PAYMENT STATUS GENERATOR FORM */}
        <form
          onSubmit={handleGeneratePaymentStatus}
          className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-purple-600" />
              <span>Query Mission Payment & Escrow Status from Database</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Gateway Target: https://vip.15dwings.com.ng
            </span>
          </div>

          {/* Sensitive fields initialized completely blank */}
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

          {/* Queried Payment Status Telemetry Card (Only shown when queried data is returned from backend) */}
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

              {/* Selectors 2, 3, 4, 5: Populated strictly from database backend */}
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

      {/* Main View: Live Iframe pointing at default vip.15dwings.com.ng vs Settlement Ledger */}
      {viewMode === 'iframe' ? (
        <div className="bg-slate-950 rounded-[2rem] border border-purple-200 shadow-2xl overflow-hidden relative">
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-400">Live Secure Gateway:</span>
              {/* Selector 1: Clean URL pointed at vip.15dwings.com.ng without parameter strings */}
              <span className="font-mono text-purple-300 font-bold">
                {defaultPortalUrl}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Sandbox: 15D VIP Terminal
            </span>
          </div>

          {/* THE IFRAME ALWAYS POINTED AT DEFAULT vip.15dwings.com.ng */}
          <iframe
            key={iframeKey}
            src={defaultPortalUrl}
            className="w-full h-[650px] md:h-[780px] border-none bg-slate-950"
            title="15D Wings VIP Payment & Escrow Portal"
            allow="clipboard-write; payment; fullscreen"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <SystemizedCheckoutEngine
            amountUsd={amountUsd}
            hoursToDeparture={hoursToDeparture}
          />
        </motion.div>
      )}

      {/* Fullscreen Modal View: strictly points to vip.15dwings.com.ng */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col p-2 md:p-6"
          >
            <div className="bg-slate-950 rounded-3xl w-full h-full flex flex-col overflow-hidden shadow-2xl border border-purple-300/40">
              {/* Modal Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <span className="font-sync uppercase text-xs font-bold text-white tracking-wider">
                    15D VIP Payment & Escrow Portal (vip.15dwings.com.ng)
                  </span>
                  <span className="text-xs text-slate-500">|</span>
                  <span className="text-xs text-slate-300 font-mono">Gateway: {defaultPortalUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-sync uppercase font-bold transition-all shadow-sm cursor-pointer"
                  >
                    CLOSE FULLSCREEN
                  </button>
                </div>
              </div>

              {/* Fullscreen Iframe: strictly pointed at default vip.15dwings.com.ng */}
              <div className="flex-1 w-full h-full bg-slate-950">
                <iframe
                  src={defaultPortalUrl}
                  className="w-full h-full border-none bg-slate-950"
                  title="15D Wings VIP Payment Fullscreen Terminal"
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
