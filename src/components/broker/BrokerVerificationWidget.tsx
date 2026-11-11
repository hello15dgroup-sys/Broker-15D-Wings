import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Plane,
  HelpCircle,
  Search,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  fetchBrokerStatus,
  launchBrokerOnboarding,
  evaluateOperatorVerification,
  isValidUUID,
  BrokerUIState,
  BrokerClearanceData,
  ManagedOperator,
  OperatorEvaluationResult
} from '../../lib/brokerVerificationApi';
import { copyToClipboard } from '../../lib/utils';

interface BrokerVerificationWidgetProps {
  initialBrokerId?: string;
  brokerEmail?: string;
  onClearanceActive?: (broker: BrokerClearanceData) => void;
  onClearanceSuspended?: () => void;
  compact?: boolean;
}

export const BrokerVerificationWidget: React.FC<BrokerVerificationWidgetProps> = ({
  initialBrokerId = '896ac12c-7d89-4ac9-a451-8edffee3ed09',
  brokerEmail = 'hello.15dgroup@gmail.com',
  onClearanceActive,
  onClearanceSuspended,
  compact = false
}) => {
  const [brokerIdInput, setBrokerIdInput] = useState<string>(
    initialBrokerId && initialBrokerId !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      ? initialBrokerId
      : '896ac12c-7d89-4ac9-a451-8edffee3ed09'
  );
  const [uiState, setUiState] = useState<BrokerUIState>({
    state: 'SUCCESS',
    broker: {
      broker_id: '896ac12c-7d89-4ac9-a451-8edffee3ed09',
      agency_name: '15D Wings for Brokers',
      organization: '15D Wings for Brokers',
      principal_name: '15D Group Principal',
      email: 'hello.15dgroup@gmail.com',
      is_verified: true,
      agency_clearance_status: 'ACTIVE',
      has_verified_operator: false,
      managed_operators_count: 0,
      managed_operators: []
    }
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [launchingOnboarding, setLaunchingOnboarding] = useState(false);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);

  // Operator evaluation state
  const [evaluatingOperatorId, setEvaluatingOperatorId] = useState<string | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<Record<string, OperatorEvaluationResult>>({});

  const handleValidateClearance = useCallback(async (idToQuery?: string) => {
    const id = (idToQuery !== undefined ? idToQuery : brokerIdInput).trim();
    if (!id) return;
    const result = await fetchBrokerStatus(id, (nextState) => {
      setUiState(nextState);
    });

    if (result.state === 'SUCCESS') {
      const hasVerifiedOp = Boolean(
        result.broker.has_verified_operator ||
        (result.broker.managed_operators && result.broker.managed_operators.some((o) => o.is_verified))
      );
      if (hasVerifiedOp) {
        onClearanceActive?.(result.broker);
      }
    } else if (result.state === 'SUSPENDED') {
      onClearanceSuspended?.();
    }
  }, [brokerIdInput, onClearanceActive, onClearanceSuspended]);

  useEffect(() => {
    async function resolveActiveBroker() {
      const targetId = (initialBrokerId && initialBrokerId !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
        ? initialBrokerId
        : '896ac12c-7d89-4ac9-a451-8edffee3ed09';

      setBrokerIdInput(targetId);

      // Verify with Cloudflare clearinghouse worker in background
      try {
        const result = await fetchBrokerStatus(targetId, (nextState) => {
          if (nextState.state !== 'LOADING') {
            setUiState(nextState);
          }
        });
        if (result.state === 'SUCCESS') {
          const hasVerifiedOp = Boolean(
            result.broker.has_verified_operator ||
            (result.broker.managed_operators && result.broker.managed_operators.some((o) => o.is_verified))
          );
          if (hasVerifiedOp) {
            onClearanceActive?.(result.broker);
          }
        }
      } catch (e) {
        console.warn('Background clearance check note:', e);
      }
    }

    resolveActiveBroker();
  }, [initialBrokerId, onClearanceActive]);

  // Launch Onboarding Portal action
  const handleLaunchOnboarding = async () => {
    setLaunchingOnboarding(true);
    try {
      const res = await launchBrokerOnboarding(brokerIdInput, brokerEmail);
      if (res.success && res.redirect_url) {
        setLaunchUrl(res.redirect_url);
        window.open(res.redirect_url, '_blank');
      }
    } catch (e) {
      console.error('Launch onboarding error:', e);
    } finally {
      setLaunchingOnboarding(false);
    }
  };

  // Copy Onboarding Link
  const handleCopyOnboardingLink = async () => {
    let url = launchUrl;
    if (!url) {
      const res = await launchBrokerOnboarding(brokerIdInput, brokerEmail);
      if (res.success && res.redirect_url) {
        url = res.redirect_url;
        setLaunchUrl(url);
      } else {
        url = `https://airlines.15dwings.com.ng/?ref_broker=${brokerIdInput}&prefill_email=${encodeURIComponent(brokerEmail)}`;
      }
    }

    if (url) {
      await copyToClipboard(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Evaluate Operator Verification & Credit Broker
  const handleEvaluateOperator = async (operatorId: string) => {
    setEvaluatingOperatorId(operatorId);
    try {
      const res = await evaluateOperatorVerification(operatorId);
      if (res.success && res.evaluation) {
        setEvaluationResults((prev) => ({
          ...prev,
          [operatorId]: res.evaluation!
        }));
      }
    } catch (e) {
      console.error('Operator evaluation error:', e);
    } finally {
      setEvaluatingOperatorId(null);
    }
  };

  const isInvalidFormat = uiState.state === 'INVALID_UUID';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-left font-sans">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Broker Verification & Clearance Orchestration</span>
            </h3>
            <p className="text-xs text-slate-300">
              Live 15D clearance network & operator accreditation clearinghouse
            </p>
          </div>
        </div>

        {/* Dynamic Badge for Header */}
        <div className="flex items-center gap-2">
          {uiState.state === 'LOADING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-200 border border-slate-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Checking...</span>
            </span>
          )}

          {uiState.state === 'SUCCESS' && (() => {
            const isOpVerified = Boolean(
              uiState.broker.has_verified_operator ||
              (uiState.broker.managed_operators && uiState.broker.managed_operators.some((o) => o.is_verified))
            );
            return isOpVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>WORKSPACE UNLOCKED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-400/40">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>ID FOUND • AIRLINE LINK PENDING</span>
              </span>
            );
          })()}

          {uiState.state === 'SUSPENDED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>SUSPENDED</span>
            </span>
          )}

          {uiState.state === 'NOT_FOUND' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <span>NOT REGISTERED</span>
            </span>
          )}

          {uiState.state === 'INVALID_UUID' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-400/40">
              <ShieldX className="w-3.5 h-3.5 text-red-400" />
              <span>INVALID IDENTIFIER</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Input & Lookup Form */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Broker Account ID</span>
            </label>
            <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
              <span>Database Key (public.brokers)</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={brokerIdInput}
                onChange={(e) => {
                  setBrokerIdInput(e.target.value);
                  if (uiState.state === 'INVALID_UUID') {
                    setUiState({ state: 'IDLE' });
                  }
                }}
                placeholder="896ac12c-7d89-4ac9-a451-8edffee3ed09"
                className={`w-full px-3.5 py-2.5 pr-20 rounded-xl text-xs font-mono font-bold transition-all border outline-none ${
                  isInvalidFormat
                    ? 'border-red-500 bg-red-50/50 text-red-950 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 bg-slate-50/50 text-slate-900 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(brokerIdInput);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="absolute right-2.5 top-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                title="Copy broker ID"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleValidateClearance()}
              disabled={uiState.state === 'LOADING'}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {uiState.state === 'LOADING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-slate-300" />
                  <span>Query Registry</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-600 flex items-start gap-1.5 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Profile key for <strong>{brokerEmail || 'hello.15dgroup@gmail.com'}</strong>. Merely having an account ID does <strong>not</strong> grant workspace flight clearance. You must link a verified airline operator below.
            </span>
          </p>

          {/* Input Validation Error */}
          {isInvalidFormat && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Please enter a valid broker reference identifier.</p>
                <p className="text-[11px] text-red-700 mt-0.5 font-mono">
                  The identifier must match your registered broker clearance key (UUID format).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* UI STATE RENDERING ACCORDING TO CONTRACT */}

        {/* 1. LOADING STATE */}
        {uiState.state === 'LOADING' && (
          <div className="p-8 rounded-2xl bg-purple-50/40 border border-purple-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 flex items-center justify-center mx-auto text-purple-600 shadow-sm animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Validating broker clearance...</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Connecting to 15D Wings verification clearinghouse and evaluating operator accreditation records.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-1">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* 2. SUCCESS STATE (agency_clearance_status: "ACTIVE") */}
        {uiState.state === 'SUCCESS' && (() => {
          const isOperatorVerified = Boolean(
            uiState.broker.has_verified_operator ||
            (uiState.broker.managed_operators && uiState.broker.managed_operators.some((o) => o.is_verified))
          );

          return (
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 ${
              isOperatorVerified
                ? 'bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 border-emerald-200'
                : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    isOperatorVerified
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-amber-100 border-amber-300 text-amber-700'
                  }`}>
                    {isOperatorVerified ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        ID: {uiState.broker.broker_id.substring(0, 12)}...
                      </span>
                      {isOperatorVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>WORKSPACE VERIFIED</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 shadow-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>AIRLINE LINK REQUIRED (0 LINKED)</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {uiState.broker.agency_name || '15D Wings for Brokers'}
                    </h4>
                  </div>
                </div>

                {/* Primary Actions specified in contract */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyOnboardingLink}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Onboarding Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchOnboarding}
                    disabled={launchingOnboarding}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {launchingOnboarding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    <span>Launch Operator Portal</span>
                  </button>
                </div>
              </div>

              {/* Clarification Callout for Brokers */}
              {!isOperatorVerified && (
                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Important: Having an account ID does not mean your workspace is verified</span>
                  </p>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed font-sans">
                    Your broker ID is registered in the database, but aviation compliance requires an Air Operator Certificate (AOC) partner airline to be linked. Proposal creation and flight quoting remain locked until an operator is connected.
                  </p>
                </div>
              )}

              {/* Broker Agency Profile Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Organization</span>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{uiState.broker.organization || '15D Group'}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Principal Broker</span>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{uiState.broker.principal_name || '15D Group Principal'}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contact Email</span>
                  <p className="font-mono text-slate-800 mt-0.5 truncate text-[11px]">{uiState.broker.email}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Flight Clearance</span>
                  {isOperatorVerified ? (
                    <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Workspace Unlocked</span>
                    </p>
                  ) : (
                    <p className="font-bold text-amber-800 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Awaiting Airline Link</span>
                    </p>
                  )}
                </div>
              </div>

            {/* Managed Operators Section */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-purple-600" />
                  <span>Managed Fleet Operators ({uiState.broker.managed_operators_count || uiState.broker.managed_operators.length})</span>
                </span>
                <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  AOC Verified Clearinghouse
                </span>
              </div>

              {uiState.broker.managed_operators && uiState.broker.managed_operators.length > 0 ? (
                <div className="space-y-2">
                  {uiState.broker.managed_operators.map((op) => {
                    const evalResult = evaluationResults[op.id];
                    const isEvaluating = evaluatingOperatorId === op.id;

                    return (
                      <div
                        key={op.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            op.is_verified || evalResult?.is_fully_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{op.company_name}</p>
                            <span className="font-mono text-[10px] text-slate-500">ID: {op.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {evalResult ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{evalResult.verification_stage} • CREDITED</span>
                            </span>
                          ) : op.is_verified ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                              VERIFIED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                              PENDING AOC AUDIT
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEvaluateOperator(op.id)}
                            disabled={isEvaluating}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isEvaluating ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Evaluating...</span>
                              </>
                            ) : (
                              <>
                                <FileCheck2 className="w-3 h-3" />
                                <span>Evaluate Clearance</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-600">No managed operators connected yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share your onboarding link with airline operators to accredit them under your agency.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

        {/* 3. SUSPENDED STATE (agency_clearance_status: "SUSPENDED") */}
        {uiState.state === 'SUSPENDED' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/80 via-red-50/20 to-white border border-amber-300 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-600 text-white">
                  SUSPENDED
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Agency Clearance Inactive
                </h4>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-100/60 border border-amber-200 text-xs text-amber-950 font-medium">
              <p className="font-bold text-amber-900">⚠️ Booking Actions Blocked</p>
              <p className="mt-1">
                Agency clearance is currently inactive. Contact compliance. Flight proposals, fleet lockouts, and live escrow disbursements are temporarily restricted until annual verification renewal is completed.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <span className="text-slate-500 font-mono">Broker: {uiState.broker?.email}</span>
              <a
                href="mailto:compliance@15dwings.com.ng"
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold transition-all shadow-xs"
              >
                Contact 15D Compliance Team
              </a>
            </div>
          </div>
        )}

        {/* 4. BROKER_NOT_FOUND STATE (Neutral / Warning Card) */}
        {uiState.state === 'NOT_FOUND' && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-500 shadow-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900">Broker profile not found or link expired.</h4>
              <p className="text-xs text-slate-500 mt-1">
                {uiState.message || 'No broker found with this identifier in the 15D Wings clearance registry.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setBrokerIdInput('');
                  setUiState({ state: 'IDLE' });
                }}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Enter Another Broker ID
              </button>
            </div>
          </div>
        )}

        {/* 5. GENERAL ERROR / NETWORK ERROR */}
        {(uiState.state === 'ERROR' || uiState.state === 'NETWORK_ERROR') && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Clearance Registry Request Failed</p>
              <p className="mt-0.5 font-mono text-[11px]">{uiState.message}</p>
            </div>
            <button
              type="button"
              onClick={() => handleValidateClearance()}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
