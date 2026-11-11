import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  Copy,
  Building,
  Wallet,
  Globe,
  TrendingUp,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { formatCurrency, copyToClipboard } from '../../lib/utils';
import { fetchLiveFxRate, convertUsdToNgn, FxRateResult } from '../../lib/liveFxService';
import { LiveFxConverterWidget } from './LiveFxConverterWidget';

export type PaymentRailType = 'FIDELITY_NGN_NUBAN' | 'LEGACY_USD_WIRE' | 'FIREBLOCKS_USDC_ESCROW';

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
  if (currency === 'NGN') {
    return 'FIDELITY_NGN_NUBAN';
  }
  if (currency === 'USD') {
    return 'LEGACY_USD_WIRE';
  }
  return 'FIREBLOCKS_USDC_ESCROW';
}

export const SystemizedCheckoutEngine: React.FC<SystemizedCheckoutEngineProps> = ({
  amountUsd = 18687,
  hoursToDeparture = 36,
  payerLocation = 'DOMESTIC_NG',
  currency = 'USD'
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'NGN' | 'USDC'>('NGN');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFxCalculator, setShowFxCalculator] = useState(false);
  const [fxRate, setFxRate] = useState<FxRateResult>({
    baseRate: 1350.42,
    spread: 0.45,
    effectiveRate: 1350.87,
    feePercent: 1.5,
    lastUpdated: 'Live Feed',
    isLive: true
  });

  useEffect(() => {
    fetchLiveFxRate()
      .then((rate) => setFxRate(rate))
      .catch((e) => console.warn('FX rate fetch note:', e));
  }, []);

  const fxCalculation = useMemo(() => {
    return convertUsdToNgn(amountUsd, fxRate);
  }, [amountUsd, fxRate]);

  const activeRail = useMemo(() => {
    return determinePaymentRail(hoursToDeparture, selectedCurrency, payerLocation);
  }, [hoursToDeparture, selectedCurrency, payerLocation]);

  const handleCopy = async (fieldName: string, text: string) => {
    await copyToClipboard(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-purple-200 shadow-xl relative overflow-hidden bg-white text-left font-sans">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sync text-[10px] text-purple-700 tracking-[0.25em] font-bold uppercase">
              FIDELITY BANK ESCROW & SETTLEMENT ENGINE
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-gray-950 uppercase">
            Charter Flight Settlement Vault
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Zero-latency domestic NGN settlement via Fidelity Bank PLC & Legacy USD International Wire Transfer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFxCalculator(!showFxCalculator)}
            className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span>{showFxCalculator ? 'Hide FX Converter' : 'Live FX Converter (USD ⇄ NGN)'}</span>
          </button>

          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-sync tracking-wider uppercase font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Escrow Active</span>
          </span>
        </div>
      </div>

      {/* Collapsible Live FX Converter */}
      <AnimatePresence>
        {showFxCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="my-5 overflow-hidden"
          >
            <LiveFxConverterWidget initialUsdAmount={amountUsd} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {/* Left Side: Currency Selection & Rates */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block">
              PAYMENT SETTLEMENT CURRENCY
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCurrency('NGN')}
                className={`py-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  selectedCurrency === 'NGN'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-purple-50 border-purple-200 text-gray-700 hover:bg-purple-100'
                }`}
              >
                NGN (₦) Local
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency('USD')}
                className={`py-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  selectedCurrency === 'USD'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-purple-50 border-purple-200 text-gray-700 hover:bg-purple-100'
                }`}
              >
                USD ($) Wire
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency('USDC')}
                className={`py-3 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  selectedCurrency === 'USDC'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-purple-50 border-purple-200 text-gray-700 hover:bg-purple-100'
                }`}
              >
                USDC (Web3)
              </button>
            </div>
          </div>

          {/* Live FX Calculation Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold">FLIGHT WHOLESALE AMOUNT</span>
              <span className="font-mono text-purple-700 font-bold text-sm">
                ${amountUsd.toLocaleString()} USD
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/80">
              <span className="flex items-center gap-1">
                <span>LIVE FX RATE (OPEN SOURCE)</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  +0.45 spread
                </span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                1 USD = ₦{fxRate.effectiveRate.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>CONVERSION PROTOCOL FEE (1.5%)</span>
              <span className="font-mono font-bold text-slate-700">
                ₦{fxCalculation.feeNgn.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 text-xs">
              <span className="font-bold">TOTAL NAIRA PAYABLE:</span>
              <span className="font-mono font-bold text-emerald-600 text-base">
                ₦{fxCalculation.totalNgn.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
            <span className="text-[10px] text-purple-700 font-mono font-bold block uppercase">
              Settlement Protocol Guarantee:
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              All flight disbursements are held securely under <strong>SKY PARTY LTD</strong> at Fidelity Bank PLC until wheels-up flight clearance is verified by civil aviation dispatch.
            </p>
          </div>
        </div>

        {/* Right Side: Exact Bank Coordinates */}
        <div className="p-6 rounded-2xl bg-white border border-purple-200 shadow-sm flex flex-col justify-between space-y-4">
          {/* RAIL 1: NGN FIDELITY BANK NUBAN */}
          {selectedCurrency === 'NGN' && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-purple-600 tracking-widest block font-bold uppercase">
                    ENGINE 1: DOMESTIC NAIRA (NGN)
                  </span>
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4 text-purple-600" /> Fidelity Bank PLC
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  Zero Latency
                </span>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Beneficiary Name:</span>
                  <span className="text-slate-900 font-bold select-all">SKY PARTY LTD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bank Name:</span>
                  <span className="text-slate-900 font-bold">Fidelity Bank PLC</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Account Number (NUBAN):</span>
                  <span className="text-purple-700 font-bold text-base tracking-wider select-all">
                    4011612222
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Total Amount (NGN):</span>
                  <span className="text-emerald-600 font-bold text-sm">
                    ₦{fxCalculation.totalNgn.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy('account', '4011612222')}
                  className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedField === 'account' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedField === 'account' ? 'Copied Account!' : 'Copy 4011612222'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy('beneficiary', 'SKY PARTY LTD')}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedField === 'beneficiary' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedField === 'beneficiary' ? 'Copied Name!' : 'Copy SKY PARTY LTD'}</span>
                </button>
              </div>
            </div>
          )}

          {/* RAIL 2: LEGACY USD WIRE TRANSFER */}
          {selectedCurrency === 'USD' && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-purple-600 tracking-widest block font-bold uppercase">
                    ENGINE 2: LEGACY USD WIRE ACCOUNT
                  </span>
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mt-1">
                    <Globe className="w-4 h-4 text-purple-600" /> International Wire (Fidelity Bank)
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>1 to 3 Business Days</span>
                </span>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs max-h-[260px] overflow-y-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Beneficiary:</span>
                  <span className="text-slate-900 font-bold select-all">SKY PARTY LTD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>A/C Number:</span>
                  <span className="text-purple-700 font-bold text-sm select-all">5240087555</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bank:</span>
                  <span className="text-slate-900 font-bold">Fidelity Bank PLC, Nigeria</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SWIFT Code:</span>
                  <span className="text-slate-900 font-bold select-all">FIDTNGLA</span>
                </div>
                <div className="flex flex-col text-slate-600 text-[11px] pt-1">
                  <span>Bank Address:</span>
                  <span className="text-slate-800 font-sans">2 Kofo Abayomi Street, Victoria Island, Lagos, Nigeria</span>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] text-purple-700 font-bold uppercase block">
                    Route via Intermediary (Citibank NY):
                  </span>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Intermediary SWIFT:</span>
                    <span className="text-slate-900 font-bold select-all">CITIUS33</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>ABA / Routing:</span>
                    <span className="text-slate-900 font-bold select-all">021000089</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Reference:</span>
                    <span className="text-slate-900 font-bold select-all">Fidelity A/C 36115264</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Invoice Amount:</span>
                  <span className="text-emerald-600 font-bold text-sm">${amountUsd.toLocaleString()} USD</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy('usd_wire', 'Beneficiary: SKY PARTY LTD\nA/C Number: 5240087555\nBank: Fidelity Bank PLC, Nigeria (SWIFT: FIDTNGLA)\nBank Address: 2 Kofo Abayomi Street, Victoria Island, Lagos, Nigeria\nRoute via Intermediary (Citibank NY):\nSWIFT: CITIUS33\nABA/Routing: 021000089\nRef: Fidelity A/C 36115264')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                {copiedField === 'usd_wire' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'usd_wire' ? 'Complete Wire Instructions Copied!' : 'Copy USD Wire Coordinates'}</span>
              </button>
            </div>
          )}

          {/* RAIL 3: USDC STABLECOIN ESCROW */}
          {selectedCurrency === 'USDC' && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-purple-600 tracking-widest block font-bold uppercase">
                    ENGINE 3: STABLECOIN ESCROW RAILS
                  </span>
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mt-1">
                    <Wallet className="w-4 h-4 text-purple-600" /> Solana / Base USDC Vault
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                  Fireblocks MPC
                </span>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Vault Contract:</span>
                  <span className="text-purple-700 font-bold truncate max-w-[180px]">SkyParty11111...Escrow</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Network:</span>
                  <span className="text-slate-900 font-bold">Solana Mainnet-Beta / Base L2</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Amount Due (USDC):</span>
                  <span className="text-emerald-600 font-bold text-sm">${amountUsd.toLocaleString()} USDC</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy('usdc', 'SkyPartyEscrow11111111111111111111111111111111')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                {copiedField === 'usdc' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'usdc' ? 'Vault Address Copied!' : 'Copy Solana USDC Vault'}</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-slate-500 font-mono text-center">
            Sub-second webhook auto-updates flight double-entry ledger upon escrow receipt.
          </p>
        </div>
      </div>
    </div>
  );
};
