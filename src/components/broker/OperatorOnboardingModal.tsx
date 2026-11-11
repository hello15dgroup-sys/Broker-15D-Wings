import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  Plane, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Radio, 
  AlertCircle,
  X,
  Sparkles,
  Link as LinkIcon,
  Send,
  Building2,
  FileCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { copyToClipboard } from '../../lib/utils';
import { sendGasEmail } from '../../lib/premiumMailer';
import { BrokerVerificationWidget } from './BrokerVerificationWidget';
import { BrokerKycHub } from './BrokerKycHub';

export interface OperatorRecord {
  id: string;
  company_name: string;
  contact_email: string;
  is_verified: boolean;
  created_at: string;
}

interface OperatorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerId?: string;
  brokerReferralCode?: string;
  brokerEmail?: string;
  brokerCompany?: string;
  onVerificationSuccess?: () => void;
}

export const OperatorOnboardingModal: React.FC<OperatorOnboardingModalProps> = ({
  isOpen,
  onClose,
  brokerId,
  brokerReferralCode,
  brokerEmail,
  brokerCompany,
  onVerificationSuccess
}) => {
  const [copied, setCopied] = useState(false);
  const [operatorEmail, setOperatorEmail] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [operatorsList, setOperatorsList] = useState<OperatorRecord[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [isValidatingOperator, setIsValidatingOperator] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'airline_link' | 'kyc_hub' | 'worker_clearance'>('airline_link');

  const [resolvedBrokerId, setResolvedBrokerId] = useState<string>(
    brokerId && brokerId !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      ? brokerId
      : '896ac12c-7d89-4ac9-a451-8edffee3ed09'
  );
  const [resolvedRefCode, setResolvedRefCode] = useState<string>(
    brokerReferralCode || 'REF-D2E59A'
  );

  useEffect(() => {
    if (brokerId && brokerId !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
      setResolvedBrokerId(brokerId);
    } else {
      fetch(`/api/brokers/active?email=${encodeURIComponent(brokerEmail || 'hello.15dgroup@gmail.com')}`)
        .then(res => res.json())
        .then(data => {
          if (data?.broker?.id) {
            setResolvedBrokerId(data.broker.id);
            if (data.broker.referral_code) {
              setResolvedRefCode(data.broker.referral_code);
            }
          }
        })
        .catch(() => {});
    }
    if (brokerReferralCode) {
      setResolvedRefCode(brokerReferralCode);
    }
  }, [brokerId, brokerReferralCode, brokerEmail]);

  const effectiveBrokerId = resolvedBrokerId || '896ac12c-7d89-4ac9-a451-8edffee3ed09';
  const refCode = resolvedRefCode || 'REF-D2E59A';
  const inviteUrl = `https://airlines.15dwings.com.ng?broker_ref=${refCode}&broker_id=${effectiveBrokerId}`;

  const fetchConnectedOperators = async () => {
    if (!effectiveBrokerId) return;
    setIsLoadingOperators(true);
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('id, company_name, contact_email, is_verified, created_at')
        .eq('onboarded_by_broker_id', effectiveBrokerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOperatorsList(data);
        const hasVerified = data.some(op => op.is_verified);
        if (hasVerified && onVerificationSuccess) {
          onVerificationSuccess();
        }
      }
    } catch (err) {
      console.error('Error fetching operators telemetry:', err);
    } finally {
      setIsLoadingOperators(false);
    }
  };

  useEffect(() => {
    if (isOpen && effectiveBrokerId) {
      fetchConnectedOperators();

      // Subscribe to live postgres changes for operators
      const channel = supabase
        .channel('operator-telemetry-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'operators',
            filter: `onboarded_by_broker_id=eq.${effectiveBrokerId}`
          },
          () => {
            fetchConnectedOperators();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, effectiveBrokerId]);

  const handleCopyLink = () => {
    copyToClipboard(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [emailError, setEmailError] = useState('');
  const [isVibrating, setIsVibrating] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorEmail.trim() || !effectiveBrokerId) return;

    const emailTrim = operatorEmail.trim().toLowerCase();
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'zoho.com', 'proton.me', 'protonmail.com'];
    const domain = emailTrim.split('@')[1];

    if (!domain || personalDomains.includes(domain) || !emailTrim.includes('.')) {
      setEmailError('Error: Only corporate airline domains allowed (e.g. ops@airline.com). Personal emails rejected.');
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 800);
      return;
    }

    setEmailError('');
    setIsSendingInvite(true);
    
    try {
      // Record initial operator invitation record in backend
      const { data, error } = await supabase.from('operators').insert({
        company_name: operatorName.trim() || 'Invited Licensed Operator',
        contact_email: emailTrim,
        onboarded_by_broker_id: effectiveBrokerId,
        is_verified: false
      }).select().single();

      if (!error) {
        // Dispatch GAS mailer to airline operator
        try {
          await sendGasEmail({
            recipientName: operatorName.trim() || 'Executive Operator',
            recipientEmail: emailTrim,
            title: 'LICENSED AIRLINE OPERATOR INVITATION',
            subtitle: '15D WINGS EXECUTIVE BROKER NETWORK',
            badgeText: 'CARRIER ONBOARDING INVITE',
            badgeCode: 'AOC-INVITE',
            message: `You have been invited by broker ID ${effectiveBrokerId} (Referral Code: ${refCode}) to join the 15D Wings licensed carrier network. Please complete your AOC verification and fleet registration on airlines.15dwings.com.ng.`,
            portalUrl: `https://airlines.15dwings.com.ng/onboard?ref=${refCode}&broker=${effectiveBrokerId}`,
            internalRecipients: 'hello.15dgroup@gmail.com,15dwingsltd@gmail.com'
          });
        } catch (mailErr) {
          console.warn('GAS mailer notification note:', mailErr);
        }

        setInviteSuccess(true);
        setOperatorEmail('');
        setOperatorName('');
        fetchConnectedOperators();
        setTimeout(() => setInviteSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error dispatching invite:', err);
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleValidateOperatorClearance = async (operatorId?: string) => {
    if (!effectiveBrokerId) return;
    setIsValidatingOperator(true);
    try {
      const targetOp = operatorsList.find(o => o.id === operatorId);
      const targetEmail = targetOp?.contact_email || operatorEmail.trim() || 'operations@airline.com';
      const targetName = targetOp?.company_name || operatorName.trim() || 'Licensed Operator';

      const res = await fetch('/api/operators/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: effectiveBrokerId,
          operatorEmail: targetEmail,
          operatorName: targetName,
          aocNumber: 'AOC/NG/044'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Carrier verification check failed.');
      }

      await fetchConnectedOperators();
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err: any) {
      console.error('Carrier verification error:', err);
    } finally {
      setIsValidatingOperator(false);
    }
  };

  const verifiedOperatorCount = operatorsList.filter(o => o.is_verified).length;
  const isAnyVerified = verifiedOperatorCount > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-md pt-20 sm:pt-24 pb-16 px-4 sm:px-6 flex justify-center items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          className="w-full max-w-2xl bg-white rounded-3xl border border-purple-200/80 shadow-2xl shadow-purple-950/30 overflow-hidden relative my-0 shrink-0"
        >
          {/* Modal Header */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 text-white relative">
            {/* Close button inside header */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-20 flex items-center justify-center border border-white/20 shadow-sm"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-2xl backdrop-blur-md border ${
                isAnyVerified
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
              }`}>
                {isAnyVerified ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isAnyVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-[10px] font-mono uppercase tracking-widest text-emerald-200 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Workspace Flight Clearance Active</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[10px] font-mono uppercase tracking-widest text-amber-200 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Account ID Found • Airline Link Required</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-space font-bold uppercase tracking-tight">
                  Operator Onboarding & Verification Gateway
                </h2>
              </div>
            </div>
            <p className="text-xs md:text-sm text-purple-200/90 font-lexend max-w-xl leading-relaxed mt-1">
              {isAnyVerified
                ? 'Your licensed partner carrier is verified. Proposal designer & flight tools are active.'
                : 'Your broker ID is loaded from the database. Full flight quoting remains locked until an Air Operator Certificate (AOC) partner airline registers below.'}
            </p>

            {/* Quick-Glance Broker Identification Banner */}
            <div className="mt-3.5 p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Broker Account ID:</span>
                <span className="font-mono text-purple-200 font-bold tracking-tight text-[11px] select-all">
                  {effectiveBrokerId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-mono font-bold text-purple-200">
                  REF: {refCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(effectiveBrokerId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                  <span>{copied ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            {/* Modal Subtabs */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveModalTab('airline_link')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'airline_link'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-purple-200'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Airline Onboarding & Network</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('worker_clearance')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'worker_clearance'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-purple-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accreditation Registry</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('kyc_hub')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'kyc_hub'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-purple-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Broker KYC Compliance</span>
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {activeModalTab === 'worker_clearance' ? (
              <BrokerVerificationWidget
                initialBrokerId={effectiveBrokerId}
                brokerEmail={brokerEmail || 'hello.15dgroup@gmail.com'}
                onClearanceActive={() => {
                  if (onVerificationSuccess) onVerificationSuccess();
                }}
              />
            ) : activeModalTab === 'kyc_hub' ? (
              <BrokerKycHub
                brokerId={effectiveBrokerId}
                brokerEmail={brokerEmail || 'hello.15dgroup@gmail.com'}
                brokerName={brokerCompany || '15D Group Principal'}
                onKycComplete={() => {
                  if (onVerificationSuccess) onVerificationSuccess();
                }}
              />
            ) : (
              <>
            {/* Live Verification Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isAnyVerified
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-3">
                {isAnyVerified ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-space font-bold uppercase">
                    {isAnyVerified
                      ? `AOC Clearance Active (${verifiedOperatorCount} Verified Operator Linked)`
                      : 'Carrier Accreditation Pending'}
                  </h4>
                  <p className="text-[11px] font-lexend text-gray-600">
                    {isAnyVerified
                      ? 'Proposal Designer & Live Flight Quoting tools are unlocked.'
                      : 'Proposal Designer unlocks once an authorized AOC carrier is connected.'}
                  </p>
                </div>
              </div>

              <button
                onClick={fetchConnectedOperators}
                disabled={isLoadingOperators}
                className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Refresh live status from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOperators ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>

            {/* STEP 1: Broker's Unique Airline Onboarding Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-space font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                  Your Operator Onboarding Link (airlines.15dwings.com.ng)
                </label>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 font-mono text-xs text-purple-900 break-all px-2 py-1 select-all">
                  {inviteUrl}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-sync font-bold uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="Open airlines.15dwings.com.ng in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* STEP 2: Send Direct Invitation by Email */}
            <form onSubmit={handleSendInvite} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
              <h4 className="text-[11px] font-space font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                Or Dispatch Direct Invitation to Operator
              </h4>
              <div className="space-y-2">
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 transition-transform ${isVibrating ? 'animate-bounce border-red-500 ring-2 ring-red-400 rounded-xl' : ''}`}>
                  <input
                    type="text"
                    placeholder="Airline / Operator Name (e.g. ExecuJet)"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 font-lexend"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Operator Email (e.g. ops@airline.com)"
                    value={operatorEmail}
                    onChange={(e) => {
                      setOperatorEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={`px-3.5 py-2.5 rounded-xl bg-white border text-xs text-gray-900 placeholder-gray-400 focus:outline-none font-lexend ${
                      isVibrating ? 'border-red-500 bg-red-50 ring-2 ring-red-400 text-red-900' : 'border-gray-300 focus:border-purple-600'
                    }`}
                  />
                </div>
                {emailError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-lexend font-bold flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                {inviteSuccess ? (
                  <span className="text-[11px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Invite dispatched and linked to telemetry tracking!
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-lexend">
                    Operator receives onboarding link with your broker referral tag.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-sync uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingInvite ? 'Sending...' : 'Send Invite'}</span>
                </button>
              </div>
            </form>

            {/* STEP 3: Telemetry Radar Pipeline */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-space font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                Live Onboarding Telemetry Lifecycle
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-950 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>SIGNAL 01</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-space font-bold">Invite Generated</p>
                  <p className="text-[10px] text-gray-600 font-lexend">Broker referral code active</p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  operatorsList.length > 0 
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    : 'border-purple-200 bg-purple-50/40 text-gray-800'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>SIGNAL 02</span>
                    {operatorsList.length > 0 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs font-space font-bold">Portal Access</p>
                  <p className="text-[10px] text-gray-600 font-lexend">airlines.15dwings.com.ng</p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  operatorsList.length > 0
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>SIGNAL 03</span>
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-space font-bold">AOC & Fleet Audit</p>
                  <p className="text-[10px] text-gray-600 font-lexend">Civil Aviation license</p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  isAnyVerified
                    ? 'border-emerald-300 bg-emerald-100/70 text-emerald-950 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>SIGNAL 04</span>
                    {isAnyVerified ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Radio className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs font-space font-bold">Clearance Active</p>
                  <p className="text-[10px] text-gray-600 font-lexend">Proposal tool unlocked</p>
                </div>
              </div>
            </div>

            {/* STEP 4: Connected Operators Live Manifest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-space font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  Connected Operators in Ecosystem ({operatorsList.length})
                </h4>
              </div>

              {operatorsList.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 space-y-2">
                  <Plane className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-lexend text-gray-600">
                    No operators currently linked. Share your invite link with your partner airline to get started.
                  </p>
                </div>
              ) : (
                <div className="border border-purple-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {operatorsList.map((op) => (
                    <div key={op.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white hover:bg-purple-50/30 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-space font-bold text-xs text-gray-900 uppercase">
                            {op.company_name}
                          </span>
                          {op.is_verified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED (AOC ACTIVE)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-mono font-bold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> ONBOARDING AT airlines.15dwings.com.ng
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-gray-500">
                          {op.contact_email} • Connected {new Date(op.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {!op.is_verified && (
                        <button
                          onClick={() => handleValidateOperatorClearance(op.id)}
                          disabled={isValidatingOperator}
                          className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-xl text-[10px] font-sync font-bold uppercase transition-all cursor-pointer whitespace-nowrap"
                        >
                          {isValidatingOperator ? 'Verifying...' : 'Validate AOC Clearance'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
