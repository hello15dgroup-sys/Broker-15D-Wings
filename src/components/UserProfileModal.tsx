import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Calendar,
  Lock,
  AlertTriangle,
  Send,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendPremiumEmail } from '../lib/premiumMailer';

export interface UserProfileData {
  legalFirstName: string;
  legalLastName: string;
  organization: string;
  dateOfBirth: string;
  isVerified?: boolean;
  email?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onProfileUpdated?: (profile: UserProfileData) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'hello.15dgroup@gmail.com',
  onProfileUpdated
}) => {
  // Compute strict 18-year date picker boundary
  const maxDate18 = useMemo(() => {
    const today = new Date();
    const d = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return d.toISOString().split('T')[0];
  }, []);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Snapshot of locked/original credentials for change detection
  const [originalProfile, setOriginalProfile] = useState<UserProfileData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFoulPlayAuditBanner, setShowFoulPlayAuditBanner] = useState(false);
  const [isConfirmingFoulPlayChange, setIsConfirmingFoulPlayChange] = useState(false);

  // Load existing profile from backend or local storage upon open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowFoulPlayAuditBanner(false);
    setIsConfirmingFoulPlayChange(false);

    async function loadProfile() {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem('15d_broker_profile');
        let initialData: UserProfileData = {
          legalFirstName: '',
          legalLastName: '',
          organization: '',
          dateOfBirth: '',
          isVerified: false,
          email: userEmail
        };

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            initialData = {
              legalFirstName: parsed.legalFirstName || parsed.first_name || '',
              legalLastName: parsed.legalLastName || parsed.last_name || '',
              organization: parsed.organization || parsed.agency_name || '',
              dateOfBirth: parsed.dateOfBirth || parsed.date_of_birth || '',
              isVerified: parsed.isVerified ?? parsed.is_verified ?? false,
              email: parsed.email || userEmail
            };
          } catch {}
        }

        // Check live Supabase brokers table
        if (userEmail) {
          const { data, error } = await supabase
            .from('brokers')
            .select('*')
            .eq('email', userEmail.toLowerCase())
            .maybeSingle();

          if (!error && data) {
            initialData = {
              legalFirstName: data.legal_first_name || initialData.legalFirstName,
              legalLastName: data.legal_last_name || initialData.legalLastName,
              organization: data.organization || data.agency_name || initialData.organization,
              dateOfBirth: data.date_of_birth || initialData.dateOfBirth,
              isVerified: data.has_verified_operator || data.agency_clearance_status === 'ACTIVE',
              email: data.email || userEmail
            };
          }
        }

        setFirstName(initialData.legalFirstName);
        setLastName(initialData.legalLastName);
        setOrganization(initialData.organization);
        setDateOfBirth(initialData.dateOfBirth);
        setIsVerified(Boolean(initialData.isVerified));
        setOriginalProfile(initialData);
      } catch (err) {
        console.warn('Profile load warning:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [isOpen, userEmail]);

  // Check if verified profile identity details have been modified
  const hasIdentityChanged = useMemo(() => {
    if (!originalProfile) return false;
    return (
      (originalProfile.legalFirstName && firstName.trim() !== originalProfile.legalFirstName.trim()) ||
      (originalProfile.legalLastName && lastName.trim() !== originalProfile.legalLastName.trim()) ||
      (originalProfile.organization && organization.trim() !== originalProfile.organization.trim()) ||
      (originalProfile.dateOfBirth && dateOfBirth !== originalProfile.dateOfBirth)
    );
  }, [originalProfile, firstName, lastName, organization, dateOfBirth]);

  // Age validation helper
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Basic field presence checks
    if (!firstName.trim() || !lastName.trim() || !organization.trim() || !dateOfBirth) {
      setErrorMessage('All legal fields (First Name, Last Name, Organization, and Date of Birth) are mandatory.');
      return;
    }

    // 2. Strict 18+ Age verification
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      setErrorMessage('Age Restriction Law: Aviation regulation requires registered flight brokers to be at least 18 years of age.');
      return;
    }

    // 3. Civil Aviation Law governing change of identity on verified accounts
    // A verified account cannot alter credentials without triggering a foul play alert to admin at 15dgroup.ng@gmail.com
    if (isVerified && hasIdentityChanged && !isConfirmingFoulPlayChange) {
      setShowFoulPlayAuditBanner(true);
      setIsConfirmingFoulPlayChange(true);
      setErrorMessage(
        'LEGAL WARNING: Under 15D Wings Security Governance Law §4.9, this account is OPERATING UNDER VERIFIED STATUS. Changing your legal credentials triggers an immediate anti-fraud investigation relay to Mission Control Admin (15dgroup.ng@gmail.com). Click "Confirm & Dispatch Audit Relay" below to proceed.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // If verified account changed identity, trigger the mandatory foul play alert email to admin
      if (isVerified && hasIdentityChanged) {
        const foulPlayAuditPayload = {
          recipientEmail: '15dgroup.ng@gmail.com',
          recipientName: '15D Wings Mission Control Security Desk',
          title: 'SECURITY AUDIT: FOUL PLAY DETECTED // IDENTITY ALTERATION',
          subtitle: 'GOVERNANCE LAW §4.9 • VERIFIED ACCOUNT BREACH NOTICE',
          badgeText: 'FOUL PLAY ALERT',
          badgeCode: 'AUDIT-SEC-409',
          message: `CRITICAL AUDIT: A verified broker account (${userEmail}) has initiated an unauthorized alteration of locked legal identity credentials.\n\nPREVIOUS VERIFIED IDENTITY:\n• Name: ${originalProfile?.legalFirstName} ${originalProfile?.legalLastName}\n• Organization: ${originalProfile?.organization}\n• Date of Birth: ${originalProfile?.dateOfBirth}\n\nATTEMPTED NEW IDENTITY:\n• Name: ${firstName.trim()} ${lastName.trim()}\n• Organization: ${organization.trim()}\n• Date of Birth: ${dateOfBirth}\n\nAudit timestamp: ${new Date().toISOString()}.\nIP/Session telemetry flagged for investigation.`,
          internalRecipients: '15dgroup.ng@gmail.com,hello.15dgroup@gmail.com',
          showImage: false,
          showButton: false
        };

        try {
          await sendPremiumEmail(foulPlayAuditPayload);
          console.warn('[Security Audit] Foul play alert dispatched to 15dgroup.ng@gmail.com.');
        } catch (mailErr) {
          console.error('[Security Audit] Mail dispatch warning:', mailErr);
        }
      }

      // Save to Supabase backend idempotently
      const updatedProfile: UserProfileData = {
        legalFirstName: firstName.trim(),
        legalLastName: lastName.trim(),
        organization: organization.trim(),
        dateOfBirth,
        isVerified,
        email: userEmail
      };

      // 1. Send profile to backend server endpoint
      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            legalFirstName: updatedProfile.legalFirstName,
            legalLastName: updatedProfile.legalLastName,
            organization: updatedProfile.organization,
            dateOfBirth: updatedProfile.dateOfBirth,
            isVerified: updatedProfile.isVerified,
            hasIdentityChanged
          })
        });
      } catch (backendErr) {
        console.warn('Backend profile relay notice:', backendErr);
      }

      // 2. Upsert to Supabase brokers table
      const { data: sessionData } = await supabase.auth.getSession();
      const currentAuthId = sessionData?.session?.user?.id;

      const { error: upsertErr } = await supabase.from('brokers').upsert(
        {
          email: userEmail.toLowerCase(),
          ...(currentAuthId ? { auth_user_id: currentAuthId } : {}),
          legal_first_name: updatedProfile.legalFirstName,
          legal_last_name: updatedProfile.legalLastName,
          organization: updatedProfile.organization,
          agency_name: updatedProfile.organization,
          date_of_birth: updatedProfile.dateOfBirth,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'email' }
      );

      if (upsertErr) {
        console.warn('Backend profile upsert note:', upsertErr.message);
      }

      // Update local storage state
      localStorage.setItem('15d_broker_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('15d_broker_company', updatedProfile.organization);
      setOriginalProfile(updatedProfile);

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }

      if (isVerified && hasIdentityChanged) {
        setSuccessMessage(
          'Profile updated. In accordance with Governance Law §4.9, a security audit notification was dispatched to 15dgroup.ng@gmail.com.'
        );
      } else {
        setSuccessMessage('Profile credentials verified and secured successfully.');
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating profile credentials.');
    } finally {
      setIsLoading(false);
      setIsConfirmingFoulPlayChange(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 text-slate-900"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Broker Identity & Legal Profile
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Civil Aviation Compliance & Profile Tailoring
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Account Status Badge */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                isVerified
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isVerified ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold block">
                    {isVerified ? 'Verified Operational Account' : 'Pending Verification'}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    {isVerified
                      ? 'Protected by 15D Wings Security Governance Law §4.9'
                      : 'Complete your profile to unlock full white-label dispatch capabilities'}
                  </span>
                </div>
              </div>

              {isVerified && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-[10px] uppercase font-bold shrink-0">
                  LOCKED
                </span>
              )}
            </div>

            {/* Legal Governance Rule Notice */}
            <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl text-[11px] text-purple-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-purple-800">
                <FileText className="w-3.5 h-3.5" />
                <span>Identity Governance Law §4.9</span>
              </div>
              <p className="leading-relaxed text-purple-900/90 font-normal">
                To prevent fraud and preserve passenger safety protocols, verified broker identities cannot be altered without triggering a priority alert to Mission Control Admin (<span className="font-mono font-bold">15dgroup.ng@gmail.com</span>) for foul play investigation.
              </p>
            </div>

            {/* Input Grid: First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Legal First Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Alexander"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Legal Last Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sterling"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Organization / Agency */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Organization / Aviation Firm *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Apex Executive Aviation Ltd"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
            </div>

            {/* Date of Birth with Strict 18+ Date Picker Constraint */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Date of Birth (18+ Mandatory) *
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Max: {maxDate18}
                </span>
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  max={maxDate18}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Date selector strictly enforces age 18 and older in compliance with aviation licensing laws.
              </p>
            </div>

            {/* Verified Account Identity Change Warning */}
            {isVerified && hasIdentityChanged && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs space-y-1"
              >
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>IDENTITY MODIFICATION DETECTED</span>
                </div>
                <p className="text-[11px] leading-relaxed text-red-800">
                  You are editing legal credentials on a verified account. Saving will fire an immediate security audit dispatch to <span className="font-mono font-bold">15dgroup.ng@gmail.com</span> warning of potential foul play.
                </p>
              </motion.div>
            )}

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isVerified && hasIdentityChanged
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                }`}
              >
                {isLoading ? (
                  <span>Securing Profile...</span>
                ) : isVerified && hasIdentityChanged ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Confirm & Dispatch Audit Relay</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Save & Lock Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
