/**
 * Open Source Live FX Exchange Service for USD <-> NGN
 * Source: https://open.er-api.com/v6/latest/USD (Open Access, Real-time)
 * Formula specified by 15D Wings:
 * - Base Live Market Rate + 0.45 spread
 * - 1.5% Conversion Protocol Fee
 */

export interface FxRateResult {
  baseRate: number;
  spread: number;
  effectiveRate: number; // baseRate + 0.45
  feePercent: number; // 1.5%
  lastUpdated: string;
  isLive: boolean;
}

const FALLBACK_BASE_USD_NGN = 1485.50;
const FX_CACHE_KEY = '15d_live_fx_usd_ngn';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

let inMemoryRate: FxRateResult | null = null;

export async function fetchLiveFxRate(): Promise<FxRateResult> {
  const now = Date.now();

  // 1. Check in-memory cache
  if (inMemoryRate) {
    return inMemoryRate;
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(FX_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < CACHE_TTL_MS && parsed.baseRate > 100) {
        inMemoryRate = parsed.data;
        return parsed.data;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  // 3. Query Open Source Live FX API
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`FX HTTP Error ${response.status}`);
    }
    const data = await response.json();
    const liveNgnRate = Number(data?.rates?.NGN);

    if (liveNgnRate && !isNaN(liveNgnRate) && liveNgnRate > 100) {
      const spread = 0.45;
      const effectiveRate = Number((liveNgnRate + spread).toFixed(4));

      const result: FxRateResult = {
        baseRate: Number(liveNgnRate.toFixed(4)),
        spread,
        effectiveRate,
        feePercent: 1.5,
        lastUpdated: data?.time_last_update_utc || new Date().toUTCString(),
        isLive: true
      };

      inMemoryRate = result;
      try {
        localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ timestamp: now, data: result }));
      } catch {}

      return result;
    }
  } catch (err) {
    console.warn('[Live FX] Could not reach open.er-api.com, attempting secondary open fallback:', err);
  }

  // 4. Secondary fallback: exchange-rate API
  try {
    const response2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response2.ok) {
      const data2 = await response2.json();
      const liveNgn2 = Number(data2?.rates?.NGN);
      if (liveNgn2 && !isNaN(liveNgn2) && liveNgn2 > 100) {
        const spread = 0.45;
        const effectiveRate = Number((liveNgn2 + spread).toFixed(4));
        const result: FxRateResult = {
          baseRate: Number(liveNgn2.toFixed(4)),
          spread,
          effectiveRate,
          feePercent: 1.5,
          lastUpdated: data2?.date || new Date().toISOString(),
          isLive: true
        };
        inMemoryRate = result;
        return result;
      }
    }
  } catch {}

  // 5. Hardened safety fallback
  const fallbackEffective = Number((FALLBACK_BASE_USD_NGN + 0.45).toFixed(4));
  const fallbackResult: FxRateResult = {
    baseRate: FALLBACK_BASE_USD_NGN,
    spread: 0.45,
    effectiveRate: fallbackEffective,
    feePercent: 1.5,
    lastUpdated: new Date().toISOString(),
    isLive: false
  };

  inMemoryRate = fallbackResult;
  return fallbackResult;
}

/**
 * Convert USD to NGN:
 * - base calculation = usdAmount * (baseRate + 0.45)
 * - fee = grossNgn * 0.015
 * - total = grossNgn + fee
 */
export function convertUsdToNgn(usdAmount: number, fxRate: FxRateResult) {
  const safeUsd = Math.max(0, Number(usdAmount) || 0);
  const grossNgn = safeUsd * fxRate.effectiveRate;
  const feeNgn = grossNgn * (fxRate.feePercent / 100);
  const totalNgn = grossNgn + feeNgn;

  return {
    usdAmount: safeUsd,
    baseRate: fxRate.baseRate,
    spread: fxRate.spread,
    effectiveRate: fxRate.effectiveRate,
    feePercent: fxRate.feePercent,
    grossNgn: Math.round(grossNgn),
    feeNgn: Math.round(feeNgn),
    totalNgn: Math.round(totalNgn)
  };
}

/**
 * Convert NGN to USD:
 * - base calculation = ngnAmount / (baseRate + 0.45)
 * - fee = grossUsd * 0.015
 * - netUsd = grossUsd - feeUsd
 */
export function convertNgnToUsd(ngnAmount: number, fxRate: FxRateResult) {
  const safeNgn = Math.max(0, Number(ngnAmount) || 0);
  const rate = fxRate.effectiveRate > 0 ? fxRate.effectiveRate : 1485.95;
  const grossUsd = safeNgn / rate;
  const feeUsd = grossUsd * (fxRate.feePercent / 100);
  const totalUsd = grossUsd + feeUsd;

  return {
    ngnAmount: safeNgn,
    baseRate: fxRate.baseRate,
    spread: fxRate.spread,
    effectiveRate: fxRate.effectiveRate,
    feePercent: fxRate.feePercent,
    grossUsd: Number(grossUsd.toFixed(2)),
    feeUsd: Number(feeUsd.toFixed(2)),
    totalUsd: Number(totalUsd.toFixed(2))
  };
}
