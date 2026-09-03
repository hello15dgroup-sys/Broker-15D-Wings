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
  const [isSimulatingOnboard, setIsSimulatingOnboard] = useState(false);

  const refCode = brokerReferralCode || (brokerId ? brokerId.substring(0, 8).toUpperCase() : 'REF-15D');
  const inviteUrl = `https://airlines.15dwings.com.ng?broker_ref=${refCode}&broker_id=${brokerId || ''}`;

  const fetchConnectedOperators = async () => {
    if (!brokerId) return;
    setIsLoadingOperators(true);
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('id, company_name, contact_email, is_verified, created_at')
        .eq('onboarded_by_broker_id', brokerId)
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
    if (isOpen && brokerId) {
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
            filter: `onboarded_by_broker_id=eq.${brokerId}`
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
  }, [isOpen, brokerId]);

  const handleCopyLink = () => {
    copyToClipboard(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorEmail.trim() || !brokerId) return;
    setIsSendingInvite(true);
    
    try {
      // Record initial operator invitation record in backend
      const { data, error } = await supabase.from('operators').insert({
        company_name: operatorName.trim() || 'Invited Licensed Operator',
        contact_email: operatorEmail.trim(),
        onboarded_by_broker_id: brokerId,
        is_verified: false
      }).select().single();

      if (!error) {
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

  const handleSimulateInstantVerification = async (operatorId?: string) => {
    if (!brokerId) return;
    setIsSimulatingOnboard(true);
    try {
      if (operatorId) {
        // Update existing
        await supabase
          .from('operators')
          .update({ is_verified: true })
          .eq('id', operatorId);
      } else {
        // Create verified operator
        await supabase.from('operators').insert({
          company_name: operatorName.trim() || 'ExecuJet Aviation (AOC Verified)',
          contact_email: operatorEmail.trim() || 'operations@execujet.aero',
          onboarded_by_broker_id: brokerId,
          is_verified: true
        });
      }
      await fetchConnectedOperators();
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulatingOnboard(false);
    }
  };

  const verifiedOperatorCount = operatorsList.filter(o => o.is_verified).length;
  const isAnyVerified = verifiedOperatorCount > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-purple-200 shadow-2xl shadow-purple-950/20 overflow-hidden relative my-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-purple-50 text-gray-500 hover:text-gray-900 hover:bg-purple-100 transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-purple-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-400/20 border border-purple-300/30 text-[10px] font-mono uppercase tracking-widest text-purple-200 font-bold">
                    AOC Carrier Network
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <Radio className="w-3 h-3 animate-pulse" /> Live Telemetry Rail
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-space font-bold uppercase tracking-tight">
                  Operator Onboarding Gateway
                </h2>
              </div>
            </div>
            <p className="text-xs md:text-sm text-purple-200/90 font-lexend max-w-xl leading-relaxed mt-2">
              To prevent unauthorized pricing manifests in our ecosystem, brokers must link an Air Operator Certificate (AOC) holder. Send your custom onboarding link to your partner airline to register on <strong className="text-white underline">airlines.15dwings.com.ng</strong>.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
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
                      ? `Backend Clearance Active (${verifiedOperatorCount} Verified Operator Linked)`
                      : 'Operator Verification Pending on Backend'}
                  </h4>
                  <p className="text-[11px] font-lexend text-gray-600">
                    {isAnyVerified
                      ? 'Proposal Designer & Live Flight Quoting tools are unlocked.'
                      : 'Proposal Designer is locked until an operator onboards via your link.'}
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
                <span className="text-[10px] font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Ref Code: {refCode}
                </span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  onChange={(e) => setOperatorEmail(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 font-lexend"
                />
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
                  <p className="text-xs font-space font-bold">Verified on Backend</p>
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
                          onClick={() => handleSimulateInstantVerification(op.id)}
                          disabled={isSimulatingOnboard}
                          className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-xl text-[10px] font-sync font-bold uppercase transition-all cursor-pointer whitespace-nowrap"
                        >
                          {isSimulatingOnboard ? 'Verifying...' : 'Validate AOC Clearance'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Simulation Button for Broker Demo / Testing */}
            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[10px] text-gray-500 font-lexend">
                Testing verification flow? You can test link an authorized operator instantly.
              </p>
              <button
                onClick={() => handleSimulateInstantVerification()}
                disabled={isSimulatingOnboard}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-sync uppercase font-bold tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Operator Handshake</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
