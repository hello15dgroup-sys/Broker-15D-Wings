import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CreditCard, ArrowRight, CheckCircle2, Copy, AlertTriangle, Zap, Building, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export type PaymentRailType = 'PROVIDUS_VIRTUAL_NUBAN' | 'FIREBLOCKS_USDC_ESCROW' | 'BRIDGE_FIAT_AUTO_OFFRAMP';

interface SystemizedCheckoutEngineProps {
  amountUsd?: number;
  hoursToDeparture?: number;
  payerLocation?: 'DOMESTIC_NG' | 'INTERNATIONAL';
  currency?: 'NGN' | 'USD' | 'USDC';
}

export function determinePaymentRail(
  hoursToDeparture: number,
  currency: 'NGN' | 'USD' | 'USDC',
  payerLocation: 'DOMESTIC_NG' | 'INTERNATIONAL'
): PaymentRailType {
  // RULE 1: Urgent Bookings (< 48 Hours) MUST use Zero-Latency Rails
  if (hoursToDeparture < 48) {
    if (currency === 'NGN' || payerLocation === 'DOMESTIC_NG') {
      return 'PROVIDUS_VIRTUAL_NUBAN';
    } else {
      return 'FIREBLOCKS_USDC_ESCROW';
    }
  }

  // RULE 2: International USD Payments enforce Fireblocks/Bridge settlement
  if (currency === 'USD' || payerLocation === 'INTERNATIONAL') {
    return 'BRIDGE_FIAT_AUTO_OFFRAMP';
  }

  return 'PROVIDUS_VIRTUAL_NUBAN';
}

export const SystemizedCheckoutEngine: React.FC<SystemizedCheckoutEngineProps> = ({
  amountUsd = 18687,
  hoursToDeparture = 36,
  payerLocation = 'DOMESTIC_NG',
  currency = 'USD'
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'NGN' | 'USDC'>('USD');
  const [copiedAccount, setCopiedAccount] = useState(false);

  const usdToNgnRate = 1480;
  const amountNgn = amountUsd * usdToNgnRate;

  const activeRail = useMemo(() => {
    return determinePaymentRail(hoursToDeparture, selectedCurrency, payerLocation);
  }, [hoursToDeparture, selectedCurrency, payerLocation]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#07131e]/90 to-black/90">
      <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
            <span className="ui-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
              MODULE 5 — CHECKOUT & PAYMENT ROUTING
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-white uppercase">
            Payment Locked & Safe
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Automated zero-latency financial settlement via Providus Bank & Fireblocks Solana Escrow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono tracking-wider uppercase font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Double-Entry Ledger Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {/* Left Side: Currency & Urgency Rules */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="ui-sync text-[9px] text-gray-400 tracking-widest uppercase block">
              PAYMENT CURRENCY SELECTION
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedCurrency('USD')}
                className={`py-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                  selectedCurrency === 'USD'
                    ? 'bg-fbblue border-fbblue text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setSelectedCurrency('NGN')}
                className={`py-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                  selectedCurrency === 'NGN'
                    ? 'bg-fbblue border-fbblue text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                NGN (₦)
              </button>
              <button
                onClick={() => setSelectedCurrency('USDC')}
                className={`py-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                  selectedCurrency === 'USDC'
                    ? 'bg-fbblue border-fbblue text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                USDC (Solana)
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center text-gray-400 text-[10px] ui-sync">
              <span>TIME TO DEPARTURE</span>
              <span className="font-mono text-fbblue font-bold">{hoursToDeparture} HOURS ({hoursToDeparture < 48 ? 'URGENT <48h' : 'STANDARD'})</span>
            </div>
            <div className="flex justify-between items-center text-gray-400 text-[10px] ui-sync">
              <span>AUTOMATED RAIL SELECTED</span>
              <span className="font-mono text-emerald-400 font-bold">{activeRail.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-fbblue/10 border border-fbblue/30 space-y-1">
            <span className="text-[10px] text-fbblue font-mono font-bold block">
              AUTOMATED ROUTING EVALUATOR RULE:
            </span>
            <p className="text-xs text-gray-300 font-light leading-relaxed">
              {hoursToDeparture < 48
                ? "Urgent flight (<48 hrs) enforced zero-latency bank transfer or Solana USDC escrow. Sub-3-second webhook settlement."
                : "Standard international settlement routed via Bridge Enterprise Fiat-to-USDC auto off-ramp."}
            </p>
          </div>
        </div>

        {/* Right Side: Rail Payment Details */}
        <div className="p-6 rounded-2xl bg-black/80 border border-white/15 flex flex-col justify-between space-y-4">
          {activeRail === 'PROVIDUS_VIRTUAL_NUBAN' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="ui-sync text-[9px] text-fbblue tracking-widest block font-bold">
                    ENGINE A: LOCAL NGN RAILS
                  </span>
                  <h4 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4 text-fbblue" /> Providus Bank Virtual Account
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold uppercase">
                  Code 033
                </span>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Bank Name:</span>
                  <span className="text-white font-bold">Providus Bank</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Account Number:</span>
                  <span className="text-fbblue font-bold text-sm tracking-wider">9928104829</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Account Title:</span>
                  <span className="text-white">15D Wings / Mission Escrow</span>
                </div>
                <div className="flex justify-between text-gray-400 pt-2 border-t border-white/10">
                  <span>Amount Due (NGN):</span>
                  <span className="text-emerald-400 font-bold text-sm">₦{amountNgn.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => handleCopyAccount('9928104829')}
                className="w-full py-3 rounded-xl bg-fbblue hover:bg-fbblue/90 text-white font-sync text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(24,119,242,0.4)]"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedAccount ? 'Account Copied!' : 'Copy Providus NUBAN Account'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="ui-sync text-[9px] text-fbblue tracking-widest block font-bold">
                    ENGINE B: STABLECOIN ESCROW RAILS
                  </span>
                  <h4 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                    <Wallet className="w-4 h-4 text-fbblue" /> Solana USDC Anchor Escrow
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded bg-fbblue/20 text-fbblue text-[9px] font-mono font-bold uppercase">
                  Fireblocks MPC
                </span>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Vault Contract:</span>
                  <span className="text-fbblue font-bold truncate max-w-[180px]">Aviat11111...Escrow</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Network:</span>
                  <span className="text-white">Solana Mainnet-Beta / Base L2</span>
                </div>
                <div className="flex justify-between text-gray-400 pt-2 border-t border-white/10">
                  <span>Amount Locked (USDC):</span>
                  <span className="text-emerald-400 font-bold text-sm">${amountUsd.toLocaleString()} USDC</span>
                </div>
              </div>

              <button
                onClick={() => handleCopyAccount('AviationEscrow11111111111111111111111111111111')}
                className="w-full py-3 rounded-xl bg-fbblue hover:bg-fbblue/90 text-white font-sync text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(24,119,242,0.4)]"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedAccount ? 'Vault Copied!' : 'Copy Solana USDC Vault Address'}</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-400 font-mono text-center">
            Sub-3-second webhook auto-updates double-entry ledger upon payment receipt.
          </p>
        </div>
      </div>
    </div>
  );
};
