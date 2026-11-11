import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft, DollarSign, ShieldCheck, Copy, Check, TrendingUp, Info } from 'lucide-react';
import { fetchLiveFxRate, convertUsdToNgn, convertNgnToUsd, FxRateResult } from '../../lib/liveFxService';
import { copyToClipboard } from '../../lib/utils';

interface LiveFxConverterWidgetProps {
  initialUsdAmount?: number;
  compact?: boolean;
  onConvertedNgnChange?: (ngn: number) => void;
}

export const LiveFxConverterWidget: React.FC<LiveFxConverterWidgetProps> = ({
  initialUsdAmount = 18687,
  compact = false,
  onConvertedNgnChange
}) => {
  const [direction, setDirection] = useState<'USD_TO_NGN' | 'NGN_TO_USD'>('USD_TO_NGN');
  const [inputValue, setInputValue] = useState<string>(String(initialUsdAmount));
  const [fxRate, setFxRate] = useState<FxRateResult>({
    baseRate: 1350.42,
    spread: 0.45,
    effectiveRate: 1350.87,
    feePercent: 1.5,
    lastUpdated: 'Live Market Feed',
    isLive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadRate = async () => {
    setIsLoading(true);
    try {
      const rate = await fetchLiveFxRate();
      setFxRate(rate);
    } catch (e) {
      console.warn('Error loading FX rate:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);

  const numVal = parseFloat(inputValue.replace(/,/g, '')) || 0;

  const usdResult = direction === 'USD_TO_NGN'
    ? convertUsdToNgn(numVal, fxRate)
    : null;

  const ngnResult = direction === 'NGN_TO_USD'
    ? convertNgnToUsd(numVal, fxRate)
    : null;

  useEffect(() => {
    if (usdResult && onConvertedNgnChange) {
      onConvertedNgnChange(usdResult.totalNgn);
    }
  }, [usdResult?.totalNgn, onConvertedNgnChange]);

  const toggleDirection = () => {
    if (direction === 'USD_TO_NGN') {
      setDirection('NGN_TO_USD');
      if (usdResult) {
        setInputValue(String(usdResult.totalNgn));
      }
    } else {
      setDirection('USD_TO_NGN');
      if (ngnResult) {
        setInputValue(String(ngnResult.totalUsd));
      }
    }
  };

  const handleCopyTotal = (text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-left font-sans">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Open Source Live FX Converter</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[11px] text-slate-300">
              Real-time USD ⇄ NGN conversion for flights (+0.45 rate spread & 1.5% fee)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadRate}
          disabled={isLoading}
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          title="Refresh live market rate"
        >
          <RefreshCw className={`w-3 h-3 text-purple-300 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync FX</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Rate Summary Strip */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-sans">Live Market Rate:</span>
            <span className="font-bold text-slate-900">
              $1.00 = ₦{fxRate.baseRate.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              +₦{fxRate.spread.toFixed(2)} Spread
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="text-slate-400">Effective Rate:</span>
            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              ₦{fxRate.effectiveRate.toLocaleString()} / USD
            </span>
            <span className="text-[10px] text-slate-500">(1.5% fee applies)</span>
          </div>
        </div>

        {/* Input & Direction Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {direction === 'USD_TO_NGN' ? 'Flight Cost in US Dollars (USD)' : 'Flight Amount in Nigerian Naira (NGN)'}
            </label>
            <button
              type="button"
              onClick={toggleDirection}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-purple-200"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Switch to {direction === 'USD_TO_NGN' ? 'NGN ➔ USD' : 'USD ➔ NGN'}</span>
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400 font-mono font-bold text-sm">
              {direction === 'USD_TO_NGN' ? '$' : '₦'}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={direction === 'USD_TO_NGN' ? 'e.g. 18500' : 'e.g. 25000000'}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Transparent Cost Breakdown */}
        {direction === 'USD_TO_NGN' && usdResult && (
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Gross Converted Amount:</span>
              <span className="font-mono font-bold text-slate-900">
                ₦{usdResult.grossNgn.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1">
                <span>Conversion Protocol Fee (1.5%):</span>
                <Info className="w-3 h-3 text-slate-400" />
              </span>
              <span className="font-mono font-bold text-slate-700">
                +₦{usdResult.feeNgn.toLocaleString()}
              </span>
            </div>

            <div className="pt-2.5 border-t border-purple-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Total Payable in Naira (NGN)
                </span>
                <p className="text-lg font-bold font-mono text-purple-950 mt-0.5">
                  ₦{usdResult.totalNgn.toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyTotal(String(usdResult.totalNgn))}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Naira Total'}</span>
              </button>
            </div>
          </div>
        )}

        {direction === 'NGN_TO_USD' && ngnResult && (
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Gross Converted Amount:</span>
              <span className="font-mono font-bold text-slate-900">
                ${ngnResult.grossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Conversion Protocol Fee (1.5%):</span>
              <span className="font-mono font-bold text-slate-700">
                +${ngnResult.feeUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="pt-2.5 border-t border-purple-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Total Amount in US Dollars (USD)
                </span>
                <p className="text-lg font-bold font-mono text-purple-950 mt-0.5">
                  ${ngnResult.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyTotal(String(ngnResult.totalUsd))}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy USD Total'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
