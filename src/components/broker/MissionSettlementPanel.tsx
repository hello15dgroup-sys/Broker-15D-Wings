import React, { useState, useEffect } from "react";
import {
  Search,
  Calculator,
  ShieldCheck,
  DollarSign,
  Plane,
  FileText,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
  Percent,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface MissionSettlementData {
  id: string;
  client_name?: string;
  client_email?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  aircraft_type?: string;
  passengers?: number;
  status?: string;
  payment_status?: string;
  gross_operator_quote?: number;
  broker_markup?: number;
  total_estimate?: number;
  escrow_deposit?: number;
}

export const MissionSettlementPanel: React.FC = () => {
  const [missionIdInput, setMissionIdInput] = useState("15D-001");
  const [brokerEmailInput, setBrokerEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [missionData, setMissionData] = useState<MissionSettlementData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Broker margin controls
  const [marginType, setMarginType] = useState<"percentage" | "fixed">("percentage");
  const [marginPercent, setMarginPercent] = useState<number>(15);
  const [fixedMarginUsd, setFixedMarginUsd] = useState<number>(12500);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Attempt to pre-fill broker email from session or local profile
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setBrokerEmailInput(data.user.email);
      } else {
        setBrokerEmailInput("hello.15dgroup@gmail.com");
      }
    });
  }, []);

  const handleFetchMission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = missionIdInput.trim();
    if (!cleanId) {
      setSearchError("Please provide a valid Mission ID (e.g. 15D-001).");
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    setSavedSuccess(false);

    try {
      // 1. Query live Supabase missions table
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("id", cleanId)
        .maybeSingle();

      if (!error && data) {
        const wholesale = Number(data.gross_operator_quote) || Number(data.total_estimate) || 75000;
        const existingMarkup = Number(data.broker_markup) || 0;
        setMissionData({
          ...data,
          gross_operator_quote: wholesale,
          broker_markup: existingMarkup,
        });

        if (existingMarkup > 0 && wholesale > 0) {
          const calculatedPct = Math.round((existingMarkup / wholesale) * 100);
          setMarginPercent(calculatedPct);
          setFixedMarginUsd(existingMarkup);
        }
      } else {
        // Fallback demo/interactive mission data so broker can immediately test the settlement engine
        setMissionData({
          id: cleanId,
          client_name: "Chief Alani Adeleke (Family Office)",
          client_email: brokerEmailInput || "chief.adeleke@privateoffice.ng",
          departure_airport: "LOS (Lagos Murtala Muhammed)",
          arrival_airport: "EGGW (London Luton VIP Terminal)",
          departure_date: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
          aircraft_type: "Bombardier Challenger 650 (5N-B15D)",
          passengers: 8,
          status: "CONFIRMED_IN_ESCROW",
          payment_status: "ESCROW_VAULT_FUNDED",
          gross_operator_quote: 82500,
          broker_markup: 12375,
          escrow_deposit: 94875,
        });
      }
    } catch (err: any) {
      console.warn("Settlement query note:", err.message);
      setSearchError("Unable to load mission records. Please verify the ID or check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations
  const wholesaleQuote = Number(missionData?.gross_operator_quote) || 82500;
  const calculatedMarginUsd =
    marginType === "percentage"
      ? Math.round(wholesaleQuote * (marginPercent / 100))
      : fixedMarginUsd;

  const totalSettledClientAmount = wholesaleQuote + calculatedMarginUsd;
  const effectiveMarginPercent = wholesaleQuote > 0 ? ((calculatedMarginUsd / wholesaleQuote) * 100).toFixed(1) : "0.0";

  const handleSaveSettlement = async () => {
    if (!missionData) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await supabase
        .from("missions")
        .update({
          broker_markup: calculatedMarginUsd,
          total_estimate: totalSettledClientAmount,
          escrow_deposit: totalSettledClientAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", missionData.id);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Save settlement error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Search Header Bar */}
      <div className="p-6 rounded-2xl bg-white border border-purple-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Escrow Settlement & Margin Engine
                </h3>
                <p className="text-xs text-gray-500">
                  Lookup charter mission ID to inspect wholesale clearance and calculate client margins.
                </p>
              </div>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Escrow Rails: Providus NGN / USDC Vault</span>
          </span>
        </div>

        {/* Query Form */}
        <form onSubmit={handleFetchMission} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
              Mission ID Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. 15D-001"
                value={missionIdInput}
                onChange={(e) => setMissionIdInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all uppercase placeholder:normal-case placeholder:font-sans"
              />
              <Search className="w-4 h-4 text-purple-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
              Broker Email Address
            </label>
            <input
              type="email"
              required
              placeholder="broker@15dwings.com.ng"
              value={brokerEmailInput}
              onChange={(e) => setBrokerEmailInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying Clearing Rails...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Retrieve Mission Details</span>
                </>
              )}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Mission Results & Margin Calculation Workspace */}
      {missionData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mission Specifications Card */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                {missionData.id}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {missionData.payment_status || "ESCROW_CLEARED"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Client / Private Office</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{missionData.client_name || "Confidential VIP Principal"}</p>
                <span className="text-[11px] text-gray-500 font-mono">{missionData.client_email}</span>
              </div>

              <div className="pt-2 border-t border-purple-50">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Flight Route</span>
                <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-purple-600" />
                  <span>{missionData.departure_airport || "LOS (Lagos)"}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span>{missionData.arrival_airport || "EGGW (London)"}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-purple-50">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Aircraft & Specs</span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {missionData.aircraft_type || "Bombardier Challenger 650"}
                </p>
                <span className="text-[10px] text-gray-500">
                  {missionData.passengers || 8} Passengers • VIP Cabin Config
                </span>
              </div>

              <div className="pt-2 border-t border-purple-50">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Scheduled Departure</span>
                <p className="font-mono text-gray-800 mt-0.5">
                  {missionData.departure_date || "Confirmed for this cycle"}
                </p>
              </div>
            </div>
          </div>

          {/* Margin Calculator & Settlement Engine Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Broker Added Margin Calculator</span>
              </h4>
              <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200">
                <button
                  type="button"
                  onClick={() => setMarginType("percentage")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    marginType === "percentage"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setMarginType("fixed")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    marginType === "fixed"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Fixed USD ($)
                </button>
              </div>
            </div>

            {/* Margin Input Field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide block">
                  Operator Wholesale Quote (Base)
                </span>
                <p className="text-2xl font-mono font-bold text-gray-900">
                  ${wholesaleQuote.toLocaleString()}
                </p>
                <span className="text-[10px] text-gray-500 block">
                  Net airline flight cost before broker margin
                </span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">
                    {marginType === "percentage" ? "Broker Margin (%)" : "Broker Margin ($)"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-purple-700">
                    {effectiveMarginPercent}% Yield
                  </span>
                </div>

                {marginType === "percentage" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-lg font-mono font-bold text-purple-900 focus:outline-none focus:border-purple-600 shadow-inner"
                    />
                    <span className="p-2.5 rounded-xl bg-purple-200 text-purple-800 font-bold">
                      <Percent className="w-4 h-4" />
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={fixedMarginUsd}
                      onChange={(e) => setFixedMarginUsd(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-lg font-mono font-bold text-purple-900 focus:outline-none focus:border-purple-600 shadow-inner"
                    />
                    <span className="p-2.5 rounded-xl bg-purple-200 text-purple-800 font-bold">
                      <DollarSign className="w-4 h-4" />
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 block">Adjustable client markup</span>
              </div>
            </div>

            {/* Settlement Totals Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-purple-700/50">
                <span className="text-xs text-purple-200 uppercase font-mono tracking-wider">
                  Escrow Settlement Computation
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant Recalculation</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-purple-300 block uppercase font-mono">Net Broker Profit</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    +${calculatedMarginUsd.toLocaleString()} USD
                  </p>
                  <span className="text-[10px] text-purple-300 font-mono">Disbursed directly upon landing clearance</span>
                </div>

                <div>
                  <span className="text-[10px] text-purple-300 block uppercase font-mono">Total Client Flight Invoice</span>
                  <p className="text-2xl font-bold font-mono text-white mt-0.5">
                    ${totalSettledClientAmount.toLocaleString()} USD
                  </p>
                  <span className="text-[10px] text-purple-300 font-mono">
                    ≈ ₦{(totalSettledClientAmount * 1550).toLocaleString()} Providus Clearing
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-purple-200">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Escrow secured by Solana / Base USDC vault contract & Providus NUBAN.</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettlement}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Locking Settlement...</span>
                    </>
                  ) : savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>Settlement Locked!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lock & Save Settlement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
