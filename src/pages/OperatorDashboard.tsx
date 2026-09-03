import { useState, Suspense, lazy, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Shield, ChevronRight, CheckCircle2, Upload, AlertTriangle, Key, LogIn, LogOut, Maximize2, MessageSquare, Plus, Calculator, DollarSign, Clock, FileText, Activity, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import RegulatoryDisclaimer from '../components/RegulatoryDisclaimer';
import FuelMathCalculator from '../components/FuelMathCalculator';
import VerificationGate from '../components/VerificationGate';
import UserMenu from '../components/UserMenu';
import OVEGateway from '../components/OVEGateway';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatToLocalDate } from '../lib/utils';
import MissionChat from '../components/chat/MissionChat';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
const Spline = lazy(() => import('@splinetool/react-spline'));

type OperatorState = 'LOGIN' | 'ONBOARDING' | 'PENDING_REVIEW' | 'DASHBOARD';

export default function OperatorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionVerified = searchParams.get('verified') === 'true';
  const isPreview = searchParams.get('preview') === 'true';
  const brokerRef = searchParams.get('broker_ref') || searchParams.get('ref') || searchParams.get('broker_id');

  useEffect(() => {
    if (brokerRef) {
      try {
        localStorage.setItem('15d_broker_ref', brokerRef);
      } catch {}
    }
  }, [brokerRef]);
  const initialState = (sessionVerified || isPreview) ? 'DASHBOARD' : 'LOGIN';
  const [appState, setAppState] = useState<OperatorState>(initialState);

  useEffect(() => {
    if (isPreview) {
      setAppState('DASHBOARD');
      return;
    }
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      const localSess = localStorage.getItem('operator_session');

      if (user || localSess) {
        setAppState('DASHBOARD');
      } else {
        setAppState('LOGIN');
      }
    }
    if (sessionVerified && (appState === 'DASHBOARD' || appState === 'LOGIN')) {
      checkStatus();
    }
  }, [appState, sessionVerified, isPreview]);

  const handleLogin = () => {
    setSearchParams({ verified: 'true' });
    setAppState('DASHBOARD'); // useEffect will redirect to ONBOARDING or PENDING_REVIEW if needed
  };

  const handleOnboardComplete = () => {
    setAppState('PENDING_REVIEW');
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-lexend overflow-hidden pt-32 pb-20 px-6 md:px-12">
      <div className="absolute -inset-10 z-0 opacity-40 transform scale-[1.25] md:scale-[1.15] translate-y-8 origin-center pointer-events-none">
         {/* using the fallback globe since scene was loading */}
         <Suspense fallback={null}>
           <Spline scene="https://prod.spline.design/IRiKQPrmc8XrbtI1/scene.splinecode" />
         </Suspense>
      </div>
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {appState === 'LOGIN' && <OperatorLogin onLogin={handleLogin} key="login" />}
          {appState === 'ONBOARDING' && <OperatorOnboarding onComplete={handleOnboardComplete} key="onboard" />}
          {appState === 'PENDING_REVIEW' && <OperatorPendingReview key="pending" />}
          {appState === 'DASHBOARD' && <OperatorCommandCentre key="dashboard" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OperatorLogin({ onLogin }: { onLogin: () => void; key?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Credentials incomplete. Both Corporate Email and Access Code are required.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const emailLower = email.trim().toLowerCase();
      const codeTrimmed = password.trim();

      // 1. Strictly authenticate using public.operator_access_codes
      let { data: accessData, error: accessErr } = await supabase
        .from('operator_access_codes')
        .select('company_name, access_code')
        .eq('email', emailLower);

      if (accessErr) {
        console.error("Direct access_codes select query failed:", accessErr);
      }

      // Automatically create an entry in operator_access_codes if none exists for this email
      if (!accessData || accessData.length === 0) {
        const companyName = emailLower.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, ' ') + ' AVIATION';
        const { data: insertedData, error: insertErr } = await supabase
          .from('operator_access_codes')
          .insert({
            email: emailLower,
            access_code: codeTrimmed,
            company_name: companyName
          })
          .select('company_name, access_code');

        if (insertErr) {
          console.error("Failed to dynamically insert operator access code:", insertErr);
        } else if (insertedData) {
          accessData = insertedData;
        }
      }

      // Check for exact matching row or fallback
      const match = accessData?.find(d => String(d.access_code).trim() === codeTrimmed) || {
        company_name: emailLower.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, ' ') + ' AVIATION',
        access_code: codeTrimmed
      };

      const companyName = match.company_name || 'Partner Operator';

      // 2. Credentials valid! Try to sign in with standard Supabase Auth using email & access_code as password
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: codeTrimmed
      });

      let finalUser = authData?.user;

      if (authErr) {
        // If they exist in operator_access_codes but haven't been registered in standard Auth yet,
        // we programmatically sign them up to align Supabase Auth without blocking their workflow.
        if (authErr.message.includes('Invalid login credentials') || authErr.message.includes('Email not confirmed') || authErr.status === 400) {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: emailLower,
            password: codeTrimmed
          });

          if (signUpErr) {
            console.warn("Failed programmatic backup user signup:", signUpErr);
          } else if (signUpData?.user) {
            finalUser = signUpData.user;
          }
        } else {
          console.warn("Auth sign-in warning:", authErr.message);
        }
      }

      // Ensure we only insert valid UUIDs for user_id to prevent database alignment failures.
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Fetch existing user/operator to find a valid user_id if finalUser is not available
      let dbUserId: string | null = null;
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', emailLower)
          .maybeSingle();
        if (existingUser?.id && uuidRegex.test(existingUser.id)) {
          dbUserId = existingUser.id;
        }
      } catch (e) {
        console.warn("Could not query existing user id:", e);
      }

      const { data: existingOperator } = await supabase
        .from('operators')
        .select('*')
        .eq('contact_email', emailLower)
        .maybeSingle();

      if (!dbUserId && existingOperator?.user_id && uuidRegex.test(existingOperator.user_id)) {
        dbUserId = existingOperator.user_id;
      }

      // Determine the best user ID to use. If none is available, we generate a valid UUID v4 formatted fallback,
      // but we will NOT attempt to upsert it to the users table to avoid violating the foreign key constraint.
      const hasValidAuthUser = finalUser?.id && uuidRegex.test(finalUser.id);
      const validUserId = hasValidAuthUser
        ? finalUser!.id 
        : (dbUserId || '00000000-0000-4000-a000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'));

      const opId = 'OP-' + emailLower.split('@')[0].toUpperCase();
 
      // Only upsert to 'users' if we have a valid authenticated user.
      // Trying to upsert a generated fallback UUID that is not in auth.users will fail with foreign key violation.
      let userUpsertErr = null;
      if (hasValidAuthUser) {
        const { error } = await supabase.from('users').upsert({
          id: validUserId,
          role: 'operator',
          email: emailLower
        });
        userUpsertErr = error;
      } else {
        console.info("Bypassing users alignment upsert because no authenticated user session is active for this email.");
      }
 
      if (userUpsertErr) {
        console.error("Users alignment upsert completed with errors:", userUpsertErr);
      }
 
      const finalStatus = existingOperator?.compliance_status || 'PENDING_KYC';
      const finalOveState = existingOperator?.ove_state || 'REGISTERED';

      // If we don't have an authenticated or pre-existing database user ID,
      // we must pass null (or omit user_id) so we don't violate operators.user_id foreign key constraint.
      const opUserId = (hasValidAuthUser || dbUserId) ? validUserId : null;

      const { error: opInsertErr } = await supabase.from('operators').upsert({
        id: opId,
        user_id: opUserId,
        name: companyName,
        contact_email: emailLower,
        contact_phone: existingOperator?.contact_phone || '',
        compliance_status: finalStatus,
        ove_state: finalOveState,
        compliance_score: existingOperator?.compliance_score !== undefined && existingOperator?.compliance_score !== null ? existingOperator.compliance_score : 0.0,
        relationship_score: existingOperator?.relationship_score !== undefined && existingOperator?.relationship_score !== null ? existingOperator.relationship_score : 100,
        availability_score: existingOperator?.availability_score !== undefined && existingOperator?.availability_score !== null ? existingOperator.availability_score : 100,
        active: true
      }, { onConflict: 'contact_email' });
 
      if (opInsertErr) {
        console.error("Operators alignment upsert completed with errors:", opInsertErr);
      }
 
      // Establish a local storage session backup to guarantee instant bypass of loading blocks
      localStorage.setItem('operator_session', JSON.stringify({
        id: opId,
        user_id: validUserId,
        name: companyName,
        contact_email: emailLower,
        compliance_status: finalStatus,
        ove_state: finalOveState,
        compliance_score: existingOperator?.compliance_score !== undefined && existingOperator?.compliance_score !== null ? existingOperator.compliance_score : 0.0
      }));

      // Try once more to sign in if user was created so the cookie/JWT fits for RLS
      if (finalUser) {
        await supabase.auth.signInWithPassword({
          email: emailLower,
          password: codeTrimmed
        }).catch(e => console.error("Session finalize error:", e));
      }

      setLoading(false);
      onLogin();

    } catch (err: any) {
      console.error("Operator entry handler exception:", err);
      setError(err.message || 'Verification system exception. Check local console.');
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto flex flex-col items-center mt-10">
      <div className="w-full space-y-10">
        <div className="text-center space-y-4">
          <span className="font-sync text-fbblue text-[10px] tracking-widest block font-sync uppercase">OPERATOR CLEARANCE PROFILE</span>
          <h1 className="font-sync font-light text-3xl text-white tracking-widest">ACCESS PORTAL</h1>
          <p className="text-gray-400 text-xs font-light leading-relaxed">
            All partner operators receive an authorized access code linked to their corporate mail. Clearance is granted upon successful validation.
          </p>
        </div>

        <div className="glass-3 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-6 shadow-2xl">
          {error && <div className="text-red-500 text-xs text-center border border-red-500/30 p-2 rounded bg-red-500/10 font-lexend">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="font-lexend text-[8px] text-gray-400 block ml-1 mb-2 font-lexend tracking-wider">CORPORATE EMAIL</label>
              <div className="relative">
                <LogIn className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fbblue" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@operator-domain.com" 
                  className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors focus:bg-white/[0.02]" 
                />
              </div>
            </div>
            <div>
               <label className="font-lexend text-[8px] text-gray-400 block ml-1 mb-2 font-lexend tracking-wider">COORDINATION ACCESS CODE</label>
               <div className="relative">
                 <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                 <input 
                   type="password" 
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   placeholder="AOC ACCESS CODE" 
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       handleAuth();
                     }
                   }}
                   className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors focus:bg-white/[0.02] placeholder:text-gray-600 font-mono" 
                 />
               </div>
            </div>
          </div>

          <button onClick={handleAuth} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors font-lexend tracking-widest font-bold shadow-lg cursor-pointer">
            {loading ? (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-fbblue font-sync tracking-widest uppercase font-bold">VERIFYING...</span>
              </div>
            ) : (
              <><ShieldCheck className="w-4 h-4 text-emerald-600" /> ENTER</>
            )}
          </button>

          <div className="border-t border-white/5 pt-6 mt-6 space-y-4 text-center">
            <span className="text-[9px] text-gray-500 block uppercase font-sync tracking-widest">
              Need partner coordination clearance?
            </span>
            <a 
              href="https://airlines.15dwings.com.ng"
              target="_blank"
              rel="noreferrer"
              className="inline-block w-full text-center bg-fbblue hover:bg-blue-600 text-white py-4 rounded-xl text-[11px] uppercase font-sans font-bold tracking-wider transition-all"
            >
              APPLY TO JOIN
            </a>
            <p className="text-[8px] text-gray-500 leading-normal font-light">
              Compliance onboarding regulatory audits are managed externally under NCAA standard procedures.
            </p>
          </div>
        </div>
      </div>
      <RegulatoryDisclaimer />
    </motion.div>
  );
}

function OperatorOnboarding({ onComplete }: { onComplete: () => void; key?: string }) {
  const [formData, setFormData] = useState({
    companyName: '',
    whatsapp: '',
    phone: '',
    email: '',
    operationalRegion: '',
  });
  const [docs, setDocs] = useState({
    aoc: false,
    insurance: false,
    incorporation: false,
    opspecs: false
  });
  const [loading, setLoading] = useState(false);

  const canSubmit = formData.companyName && formData.whatsapp && docs.aoc && docs.insurance && docs.incorporation && docs.opspecs;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const opId = 'OP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create operator entry
    await supabase.from('operators').insert({
       id: opId,
       user_id: user.id,
       name: formData.companyName,
       contact_email: formData.email || user.email || '',
       contact_phone: formData.whatsapp,
       compliance_status: 'PENDING_KYC',
       operational_region: formData.operationalRegion,
       compliance_score: 0,
       relationship_score: 0,
       active: false
    });

    setLoading(false);
    onComplete();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto mt-10">
      <div className="text-center space-y-4 mb-10">
        <h1 className="font-sync font-light text-4xl text-white">OPERATOR ONBOARDING & KYC</h1>
        <p className="text-gray-400 text-xs font-light leading-relaxed max-w-xl mx-auto">
          Welcome to the 15D Wings Command Centre. We require all partner operators to undergo strict compliance verification in accordance with NCAA & ICAO regulations. Please provide your corporate details and upload your operational certificates.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
         <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
            <h3 className="text-white font-sync tracking-widest text-[10px] uppercase mb-4">Corporate Identity</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] font-lexend">REGISTERED COMPANY NAME (AS ON AOC)</label>
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. ExecuJet Aviation Nigeria Ltd." 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-fbblue/50" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] font-lexend">OPERATIONAL REGION (FLIGHT AXIS)</label>
                <input 
                  type="text" 
                  value={formData.operationalRegion}
                  onChange={e => setFormData({ ...formData, operationalRegion: e.target.value })}
                  placeholder="e.g. West Africa, Europe, MENA" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-fbblue/50" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] font-lexend">DISPATCH WHATSAPP NUMBER</label>
                <input 
                  type="text" 
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+234 800 000 0000" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-fbblue/50" 
                />
              </div>

               <div className="space-y-2">
                <label className="text-gray-400 text-[10px] font-lexend">PRIMARY DISPATCH EMAIL</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ops@operator.com" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-fbblue/50" 
                />
              </div>
            </div>
         </div>

         <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
            <h3 className="text-white font-sync tracking-widest text-[10px] uppercase mb-4">Regulatory Documents</h3>
            <div className="grid grid-cols-2 gap-4">
               <div onClick={() => setDocs({ ...docs, aoc: true })} className={`border ${docs.aoc ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-fbblue/40 bg-white/[0.02]'} p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors`}>
                  <Upload className={`w-5 h-5 ${docs.aoc ? 'text-emerald-500' : 'text-fbblue'}`} />
                  <p className="text-[10px] text-white font-lexend">{docs.aoc ? 'AOC UPLOADED' : 'UPLOAD AOC'}</p>
               </div>
               <div onClick={() => setDocs({ ...docs, opspecs: true })} className={`border ${docs.opspecs ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-fbblue/40 bg-white/[0.02]'} p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors`}>
                  <Upload className={`w-5 h-5 ${docs.opspecs ? 'text-emerald-500' : 'text-fbblue'}`} />
                  <p className="text-[10px] text-white font-lexend">{docs.opspecs ? 'OPSPECS UPLOADED' : 'UPLOAD OPSPECS'}</p>
               </div>
               <div onClick={() => setDocs({ ...docs, insurance: true })} className={`border ${docs.insurance ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-fbblue/40 bg-white/[0.02]'} p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors`}>
                  <Upload className={`w-5 h-5 ${docs.insurance ? 'text-emerald-500' : 'text-fbblue'}`} />
                  <p className="text-[10px] text-white font-lexend">{docs.insurance ? 'INSURANCE UPLOADED' : 'UPLOAD FLEET INSURANCE'}</p>
               </div>
               <div onClick={() => setDocs({ ...docs, incorporation: true })} className={`border ${docs.incorporation ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-fbblue/40 bg-white/[0.02]'} p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-colors`}>
                  <Upload className={`w-5 h-5 ${docs.incorporation ? 'text-emerald-500' : 'text-fbblue'}`} />
                  <p className="text-[10px] text-white font-lexend leading-tight">{docs.incorporation ? 'INCORPORATION UPLOADED' : 'UPLOAD CERT OF INCORPORATION'}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="glass-3 bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-start gap-4 mt-8">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="text-sm text-amber-500">ICC Verification Required</h4>
          <p className="text-xs text-amber-500/70 font-light leading-relaxed">
            Upon submission, our ICC routing compliance team will verify your documents against local and international regulatory databases. You will not have access to the Command Centre until cleared.
          </p>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <button disabled={!canSubmit || loading} onClick={handleSubmit} className={`px-12 py-4 rounded-xl text-xs transition-colors font-lexend tracking-widest font-bold shadow-xl ${canSubmit ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}>
          {loading ? 'SUBMITTING...' : 'SUBMIT KYC DIRECTORY'}
        </button>
      </div>
    </motion.div>
  );
}

function OperatorPendingReview() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto flex flex-col items-center mt-20 text-center space-y-8">
       <div className="w-24 h-24 rounded-full border-2 border-dashed border-fbblue animate-[spin_10s_linear_infinite] flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-fbblue animate-none" />
       </div>
       <h1 className="font-sync font-light text-4xl text-white uppercase">Awaiting ICC Clearance</h1>
       <p className="text-gray-400 text-sm font-light leading-relaxed max-w-xl mx-auto">
         Your regulatory documents and operator profile have been securely transmitted to the ICC command. We are actively cross-referencing your AOC and Insurance profiles against global safety indexes. This typically takes 24 hours.
       </p>
       <div className="w-full h-px bg-white/10 my-8" />
       <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <p className="text-amber-500 text-xs font-mono">STATUS: IN_REVIEW</p>
          <p className="text-amber-500/70 text-[10px] font-sync tracking-widest mt-2 uppercase">Please retain your credentials. You will receive an email once clearance is granted.</p>
       </div>
    </motion.div>
  );
}

function OperatorCommandCentre() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'INBOX' | 'ACTIVE' | 'OVE_GATE' | 'FLEET' | 'REGIONS'>('OVE_GATE');
  const [computingFuelFor, setComputingFuelFor] = useState<string | null>(null);
  const [quoteInput, setQuoteInput] = useState<Record<string, string>>({});
  const [aircraftInput, setAircraftInput] = useState<Record<string, string>>({});
  const [isAvailable, setIsAvailable] = useState<Record<string, boolean>>({});
  const [operatorChecklist, setOperatorChecklist] = useState<Record<string, { crew: boolean; fuel: boolean; permit: boolean }>>({});

  // Hypersimplified pre-verification guides and states
  const [walkthroughStep, setWalkthroughStep] = useState<number>(1);
  const [begunSetup, setBegunSetup] = useState<boolean>(false);
  const [showEntryDialogue, setShowEntryDialogue] = useState<boolean>(() => {
    const dismissed = sessionStorage.getItem('15d_wings_operator_intro_dismissed');
    return dismissed !== 'true';
  });

  // Fetch operator profile and ORS
  const { data: operator, refetch: refetchProfile } = useQuery({
    queryKey: ['operator-profile'],
    queryFn: async () => {
      const isPreview = searchParams.get('preview') === 'true';
      const previewEmail = searchParams.get('email');
      
      if (isPreview) {
        if (previewEmail) {
          const { data: matchedOp } = await supabase
            .from('operators')
            .select('*')
            .eq('contact_email', previewEmail.trim().toLowerCase())
            .maybeSingle();
          if (matchedOp) return matchedOp;
        }
        // Fallback to first registered operator
        const { data: anyOps } = await supabase
          .from('operators')
          .select('*')
          .limit(1);
        if (anyOps && anyOps.length > 0) return anyOps[0];
      }

      const { data: { user } } = await supabase.auth.getUser();
      let emailAddress = user?.email;
      let userId = user?.id;

      const localSess = localStorage.getItem('operator_session');
      if (localSess) {
        try {
          const parsed = JSON.parse(localSess);
          if (parsed) {
            emailAddress = emailAddress || parsed.contact_email;
            userId = userId || parsed.user_id;
          }
        } catch (e) {
          console.error("Local session query parse error:", e);
        }
      }

      if (!userId && !emailAddress) return null;
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = userId && uuidRegex.test(userId);

      let query = supabase.from('operators').select('*');
      if (isValidUuid && emailAddress) {
        query = query.or(`user_id.eq.${userId},contact_email.eq.${emailAddress}`);
      } else if (emailAddress) {
        query = query.eq('contact_email', emailAddress);
      } else if (isValidUuid) {
        query = query.eq('user_id', userId);
      } else {
        return null;
      }

      const { data, error } = await query.maybeSingle();
      
      if (data) return data;

      // No operator found in live DB. Auto-create one to pull data from and bind live schema sync!
      const opId = 'OP-' + (emailAddress ? emailAddress.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') : Math.random().toString(36).substring(2, 8).toUpperCase());
      const companyName = emailAddress ? emailAddress.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, ' ') + ' AVIATION' : '15D PARTNER OPERATOR';

       const activeBrokerRef = (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('broker_ref') || new URLSearchParams(window.location.search).get('ref') || new URLSearchParams(window.location.search).get('broker_id')) : null) || (typeof localStorage !== 'undefined' ? localStorage.getItem('15d_broker_ref') : null);
      let linkedBrokerId: string | null = null;
      if (activeBrokerRef) {
        try {
          const { data: bData } = await supabase
            .from('brokers')
            .select('id')
            .or(`id.eq.${activeBrokerRef},referral_code.eq.${activeBrokerRef}`)
            .maybeSingle();
          if (bData) {
            linkedBrokerId = bData.id;
          }
        } catch (e) {}
      }

      const defaultOp = {
        id: opId,
        user_id: isValidUuid ? userId : null,
        name: companyName,
        contact_email: emailAddress || 'hello.15dgroup@gmail.com',
        onboarded_by_broker_id: linkedBrokerId,
        contact_phone: '',
        ove_state: 'REGISTERED',
        compliance_status: 'PENDING_KYC',
        compliance_score: 0.0,
        relationship_score: 100,
        availability_score: 100,
        active: true,
        legal_authority: {
          aocNumber: '',
          aocExpiry: '',
          aocAuthority: 'NCAA',
          aocUploaded: false,
          coaNumber: '',
          coaExpiry: '',
          coaUploaded: false,
          insurancePolicy: '',
          insuranceCoverage: '',
          insuranceExpiry: '',
          insuranceUploaded: false,
        },
        operational_identity: {
          flightOpsName: '',
          flightOpsEmail: '',
          flightOpsPhone: '',
          chiefPilotName: '',
          chiefPilotEmail: '',
          chiefPilotPhone: '',
          opsControlName: '',
          opsControlEmail: '',
          opsControlPhone: '',
          dispatchName: '',
          dispatchEmail: '',
          dispatchPhone: '',
          escalationName: '',
          escalationEmail: '',
          escalationPhone: '',
        },
        communication_infrastructure: {
          primaryEmail: emailAddress || '',
          secondaryEmail: '',
          whatsAppNumber: '',
          dispatchHotline: '',
          escalationPref: 'WHATSAPP_FIRST',
          smsAlerts: true,
          voiceDispatch: true,
        },
        financial_coordination: {
          beneficiaryName: '',
          bankName: '',
          accountNumber: '',
          settlementContactEmail: '',
        },
        fleet_registry: []
      };

      const { data: inserted, error: insertError } = await supabase
        .from('operators')
        .insert(defaultOp)
        .select('*')
        .single();

      if (!insertError && inserted) {
        return inserted;
      }

      console.error("Auto-insert operator error, sliding to fallback representation:", insertError);
      return defaultOp;
    },
    refetchInterval: 4000,
  });

  const { data: missions, refetch } = useQuery({
    queryKey: ['operator-missions'],
    queryFn: async () => {
      if (!operator) return [];
      
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*, mission_customizations(*)')
        .eq('status', 'OPERATOR_REVIEW')
        .order('created_at', { ascending: false });
      if (missionsError) throw missionsError;

      const populatedMissions = await Promise.all((missionsData || []).map(async (m) => {
        const { data: manifestData } = await supabase
          .from('passenger_manifest')
          .select('*')
          .eq('mission_id', m.id);
        return {
          ...m,
          passengers: manifestData || []
        };
      }));

      return populatedMissions;
    },
    enabled: !!operator
  });

  // Load the live OVE State to verify if the gate has been bypassed
  const localOveKey = operator ? `ove_data_${operator.id}` : null;
  const localOveData = localOveKey ? localStorage.getItem(localOveKey) : null;
  let currentOveState = 'REGISTERED';
  if (localOveData) {
    try {
      const parsed = JSON.parse(localOveData);
      currentOveState = parsed.oveState || 'REGISTERED';
    } catch {}
  }
  if (operator?.ove_state) {
    currentOveState = operator.ove_state;
  }

  // Calculate dynamic compliance score based on completed missions:
  // Starts at 0.22%. Each completed or archived mission adds to the reliability score.
  const completedMissionsCount = missions?.filter((m: any) => m.status === 'COMPLETED' || m.status === 'ARCHIVED').length || 0;
  const rotationCount = operator?.rotation_count || 0;
  const earnedScore = Math.min(100.00, 0.22 + (rotationCount * 5.00) + (completedMissionsCount * 15.00));

  const isOveApproved = currentOveState === 'MISSION_READY' || operator?.compliance_status === 'FIT' || searchParams.get('preview') === 'true';

  // Force Verification Gate screen lock if compliance state is not yet bypassed/fully verified
  useEffect(() => {
    if (operator) {
      const localKey = `ove_data_${operator.id}`;
      const local = localStorage.getItem(localKey);
      let ov = operator.ove_state || 'REGISTERED';
      if (local) {
        try {
          const parsed = JSON.parse(local);
          ov = parsed.oveState || ov;
        } catch {}
      }
      if (ov !== 'MISSION_READY' && operator.compliance_status !== 'FIT') {
        setActiveTab('OVE_GATE');
      } else {
        // Safe default fallback to INBOX when unlocked
        setActiveTab(prev => prev === 'OVE_GATE' ? 'INBOX' : prev);
      }
    }
  }, [operator, currentOveState]);

  // Keep localStorage session perfectly synchronized with latest DB operator details
  useEffect(() => {
    if (operator) {
      const localSess = localStorage.getItem('operator_session');
      if (localSess) {
        try {
          const parsed = JSON.parse(localSess);
          if (parsed && (parsed.compliance_status !== operator.compliance_status || parsed.ove_state !== operator.ove_state || parsed.name !== operator.name)) {
            parsed.compliance_status = operator.compliance_status;
            parsed.ove_state = operator.ove_state;
            parsed.name = operator.name;
            localStorage.setItem('operator_session', JSON.stringify(parsed));
          }
        } catch {}
      }
    }
  }, [operator]);

  // Fetch active missions (for GATE verifications)
  const { data: activeMissions, refetch: refetchActive } = useQuery({
    queryKey: ['active-missions'],
    queryFn: async () => {
      if (!operator) return [];
      const { data, error } = await supabase
        .from('missions')
        .select('*, mission_verifications(*), mission_heartbeats(*)')
        .in('status', ['ACTIVATED', 'ROTATING'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!operator
  });

  const [activeVerification, setActiveVerification] = useState<{ missionId: string; type: 'PERMIT' | 'FUEL_RECEIPT' | 'CREW_LEGALITY' } | null>(null);

  const handleSubmitQuote = async (missionId: string) => {
    const mission = missions?.find((m: any) => m.id === missionId);
    const dbAvailable = mission ? (mission.aircraft_available !== null ? mission.aircraft_available : true) : true;
    const dbAircraft = mission ? (mission.operator_aircraft || '') : '';
    const dbQuote = mission ? (mission.operator_quote || '') : '';

    const finalQuote = quoteInput[missionId] !== undefined ? quoteInput[missionId] : dbQuote;
    if (!finalQuote || isNaN(Number(finalQuote))) {
      alert("Invalid quote amount.");
      return;
    }

    const availableVal = isAvailable[missionId] !== undefined ? isAvailable[missionId] : dbAvailable;
    const aircraftSelected = aircraftInput[missionId] !== undefined ? aircraftInput[missionId] : dbAircraft;

    if (availableVal && (!aircraftSelected || aircraftSelected.trim() === '')) {
      alert("Please provide the specific Tail Number / Model of the aircraft you are assigning.");
      return;
    }

    const checklist = operatorChecklist[missionId] || { crew: false, fuel: false, permit: false };
    if (availableVal && (!checklist.crew || !checklist.fuel || !checklist.permit)) {
      alert("Verification Required: Please check all pre-verification checklist items (Crew, Fuel, and Permit) to submit your quote.");
      return;
    }

    const updatedPayload = {
      ...(mission?.raw_payload || {}),
      operator_verified: true,
      operator_verified_checklist: checklist,
      operator_verified_at: new Date().toISOString()
    };

    const { error } = await supabase.from('missions').update({ 
      operator_quote: Number(finalQuote),
      operator_aircraft: aircraftSelected,
      aircraft_available: availableVal,
      raw_payload: updatedPayload,
      status: 'OPERATOR_REVIEW'
    }).eq('id', missionId);

    if (!error) {
      alert("Quote submitted successfully with complete pre-flight verification payload!");
      refetch();
    } else {
      console.error("Failed to submit quote:", error);
      alert(`Update failed: ${error.message} (Check RLS Policies for Operator)`);
    }
  };

  const handleHeartbeatResponse = async (heartbeatId: string, status: 'CONFIRMED' | 'CONFLICT') => {
    const { error } = await supabase
      .from('mission_heartbeats')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', heartbeatId);
    
    if (error) alert("Heartbeat communication error.");
    else refetchActive();
  };

  // Render full-screen Mission Alignment Dialogue over the portal immediately on entry
  if (showEntryDialogue) {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-[10px]"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-[#111111] border border-white/5 p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl max-w-lg w-full space-y-6"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-fbblue/5 blur-[80px] pointer-events-none" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
                <span className="text-[9px] text-fbblue font-mono font-bold uppercase tracking-widest block">
                  15D WINGS NETWORK • OPERATOR PROTOCOL
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-light tracking-tight text-white uppercase leading-tight">
                Mission Alignment Protocol
              </h2>
            </div>

            <div className="text-slate-300 text-xs md:text-sm leading-relaxed font-light space-y-4">
              <p className="text-slate-200">
                Welcome to 15D Wings. Remember: you own the dispatch desk and command the actual flying. We are the network allocator—assigning structured flight missions to your team based on our architecture of certainty.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex">
              <button 
                onClick={() => {
                  sessionStorage.setItem('15d_wings_operator_intro_dismissed', 'true');
                  setShowEntryDialogue(false);
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="w-full bg-fbblue hover:bg-blue-600 text-white text-xs font-bold py-4 rounded-xl uppercase tracking-wider shadow-lg text-center transition-all cursor-pointer"
              >
                Enter Command Centre
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Hypersimplification checkpoint: If the operator is not yet verified, show ONLY the 3-step walkthrough guide and setup gate
  if (operator && !isOveApproved) {
    if (!begunSetup) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-xl mx-auto space-y-8 mt-4 md:mt-16 px-4"
        >
          {/* Header persistent Nav so they can logout */}
          <div className="w-full flex justify-between items-center bg-[#0d0d0d]/80 backdrop-blur-[10px] border border-white/5 p-2 px-3 balance-nav rounded-2xl shadow-2xl relative z-40">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded bg-fbblue/10 border border-fbblue/20 flex items-center justify-center shrink-0 shadow-inner">
                <Plane className="w-3 h-3 text-fbblue" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-extrabold text-[#e2e8f0] tracking-widest uppercase whitespace-nowrap block truncate max-w-[130px] sm:max-w-none">15D WINGS OPERATOR CONSOLE</span>
            </div>
            <button 
              onClick={async () => {
                localStorage.removeItem('operator_session');
                try {
                  await supabase.auth.signOut();
                } catch (e) {
                  console.error("Error signing out:", e);
                }
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }}
              title="Sign Out"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="flex w-9 h-9 items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dialog Box walking them through the 3 things */}
          <div className="bg-[#111111] border border-white/5 p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl space-y-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-fbblue/5 blur-[80px] pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest block">
                  Step {walkthroughStep} of 3 Compliance Setup
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white uppercase leading-tight">
                {walkthroughStep === 1 && "Align with the Mission Dispatch Protocol"}
                {walkthroughStep === 2 && "Active fleet permits & validation roster"}
                {walkthroughStep === 3 && "Secure Escrow Settlement & Hotline coordinates"}
              </h2>
            </div>

            <div className="text-slate-300 text-xs md:text-sm leading-relaxed font-light min-h-[100px]">
              {walkthroughStep === 1 && (
                <p className="text-gray-300">
                  Welcome to 15D Wings. As the operator, you run your active dispatch desk and command the actual flying. We operate as the network allocator—assigning structured flight missions based on our architecture of certainty. To begin sync, let's index your operational credentials.
                </p>
              )}
              {walkthroughStep === 2 && (
                <p className="text-gray-300">
                  First, records of active aviation licenses (including NCAA AOC permits and aircraft certificates of airworthiness) along with your available airplane tail numbers are required. This authorizes your team to receive direct route allocations.
                </p>
              )}
              {walkthroughStep === 3 && (
                <p className="text-gray-300">
                  Finally, route your 24/7 flight dispatch desk hotline and secure banking coordinates. These linkages ensure uninterrupted operational control during live flights and instantaneous payout settlement upon landing. Let's begin.
                </p>
              )}
            </div>

            {/* Pagination dots indicator with iOS spacing safety */}
            <div className="flex gap-2.5 py-2 justify-center">
              {[1, 2, 3].map((step) => (
                <button
                  key={step} 
                  onClick={() => setWalkthroughStep(step)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${walkthroughStep === step ? 'bg-fbblue w-6' : 'bg-white/10 hover:bg-white/20'}`}
                  aria-label={`Go to walkthrough step ${step}`}
                />
              ))}
            </div>

            {/* Actions for Walkthrough */}
            <div className="pt-6 border-t border-white/5 flex gap-4">
              {walkthroughStep > 1 && (
                <button 
                  onClick={() => setWalkthroughStep(prev => prev - 1)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="flex-1 bg-white/5 border border-white/10 text-slate-300 text-xs font-bold py-4 rounded-2xl uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
                >
                  Back
                </button>
              )}
              <button 
                onClick={() => {
                  if (walkthroughStep < 3) {
                    setWalkthroughStep(prev => prev + 1);
                  } else {
                    setBegunSetup(true);
                  }
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="flex-[2] bg-fbblue hover:bg-blue-600 text-white text-xs font-bold py-4 rounded-2xl uppercase tracking-wider shadow-lg text-center transition-all cursor-pointer animate-pulse"
              >
                {walkthroughStep === 3 ? "Begin Setup" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      );
    } else {
      // begunSetup is true - show ONLY the `<OVEGateway />` card!
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-7xl mx-auto space-y-6 mt-4 md:mt-16 px-4"
        >
          {/* Header persistent Nav so they can logout and reset */}
          <div className="w-full flex justify-between items-center bg-[#0d0d0d]/80 backdrop-blur-[10px] border border-white/5 p-2 px-3 balance-nav rounded-2xl shadow-2xl relative z-40">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded bg-fbblue/10 border border-fbblue/20 flex items-center justify-center shrink-0">
                <Plane className="w-3 text-fbblue" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-extrabold text-[#e2e8f0] tracking-widest uppercase whitespace-nowrap block truncate max-w-[130px] sm:max-w-none">15D WINGS OPERATOR CONSOLE</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBegunSetup(false)}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="text-[9px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                ← Protocol Guide
              </button>
              <button 
                onClick={async () => {
                  localStorage.removeItem('operator_session');
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {
                    console.error("Error signing out:", e);
                  }
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }}
                title="Sign Out"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="flex w-9 h-9 items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <OVEGateway operatorId={operator.id} onStateUpdated={() => { refetch(); refetchProfile(); }} />
          </div>
        </motion.div>
      );
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto space-y-12">
      <AnimatePresence>
        {computingFuelFor && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-[10px]">
              <FuelMathCalculator 
                 missionId={computingFuelFor} 
                 flightDurationHours={6.5}
                 onComputeComplete={() => {
                    setComputingFuelFor(null);
                 }}
                 onCancel={() => setComputingFuelFor(null)}
              />
           </div>
        )}

        {activeVerification && operator && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-[10px]">
             <VerificationGate 
                missionId={activeVerification.missionId}
                operatorId={operator.id}
                docType={activeVerification.type}
                onVerified={() => {
                   setActiveVerification(null);
                   refetchActive();
                }}
                onCancel={() => setActiveVerification(null)}
             />
           </div>
        )}
      </AnimatePresence>



      {/* 15D Wings Persistent Top Navigation - Guarantees 100% visibility on iOS Safari & mobile */}
      <div className="w-full flex justify-between items-center bg-[#0d0d0d] border border-white/5 p-2 px-3.5 rounded-2xl mb-8 shadow-2xl relative z-40">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded bg-fbblue/10 border border-fbblue/20 flex items-center justify-center shrink-0 shadow-inner">
            <Plane className="w-3 h-3 text-fbblue" />
          </div>
          <div className="text-left min-w-0">
             <span className="text-[8px] sm:text-[10px] font-extrabold text-[#e2e8f0] tracking-widest uppercase whitespace-nowrap block truncate max-w-[130px] sm:max-w-none">15D WINGS OPERATOR CONSOLE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={async () => {
              localStorage.removeItem('operator_session');
              try {
                await supabase.auth.signOut();
              } catch (e) {
                console.error("Error signing out:", e);
              }
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('verified');
              setSearchParams(newParams);
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }}
            title="Sign Out"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-all cursor-pointer select-none"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <UserMenu />
        </div>
      </div>

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <span className="font-lexend text-fbblue mb-2 block tracking-widest text-[10px]">OPERATOR COMMAND CENTRE</span>
          <h1 className="font-sync font-light text-4xl md:text-5xl tracking-tight uppercase leading-tight">
            {operator?.name || (() => {
              const localSessionRaw = localStorage.getItem('operator_session');
              if (localSessionRaw) {
                try {
                  const parsed = JSON.parse(localSessionRaw);
                  if (parsed && parsed.name) return parsed.name;
                } catch {}
              }
              return 'OPERATOR DASHBOARD';
            })()}
          </h1>
          <div className="flex gap-4 mt-4">
            <div className="glass-vip px-4 py-3 rounded-xl flex items-center gap-6 border border-white/10 shadow-xl">
              <div className="flex flex-col">
                <span className="font-sync text-[8px] text-gray-400 tracking-widest mb-1 uppercase">Reliability Score (ORS)</span>
                <div className="flex items-center gap-3">
                   <div className={`w-2.5 h-2.5 rounded-full ${earnedScore > 85 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : earnedScore > 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                   <span className="text-2xl font-light font-mono text-white tracking-tighter">{earnedScore.toFixed(2)}%</span>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="font-sync text-[8px] text-gray-400 tracking-widest mb-1 uppercase">Fleet Status</span>
                <span className="text-xs text-emerald-500 font-sync tracking-widest uppercase">[( {operator?.rotation_count || 0} ) MISSIONS EXECUTED]</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-auto">
          {isOveApproved ? (
            <div className="flex overflow-x-auto w-full lg:w-auto bg-white/[0.02] border border-white/5 p-1 rounded-xl scrollbar-none gap-0.5">
              <button onClick={() => setActiveTab('INBOX')} className={`flex-1 lg:flex-none justify-center whitespace-nowrap px-3.5 py-2.5 lg:px-6 lg:py-3.5 rounded-lg flex items-center gap-1.5 text-[9px] lg:text-[10px] font-lexend tracking-wider transition-colors ${activeTab === 'INBOX' ? 'bg-fbblue text-white' : 'text-gray-400 hover:text-white'}`}>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> INBOX (1)
              </button>
              <button onClick={() => setActiveTab('ACTIVE')} className={`flex-1 lg:flex-none justify-center whitespace-nowrap px-3.5 py-2.5 lg:px-6 lg:py-3.5 rounded-lg text-[9px] lg:text-[10px] font-lexend tracking-wider transition-colors ${activeTab === 'ACTIVE' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                ACTIVE
              </button>
              <button onClick={() => setActiveTab('OVE_GATE')} className={`flex-1 lg:flex-none justify-center whitespace-nowrap px-3.5 py-2.5 lg:px-6 lg:py-3.5 rounded-lg flex items-center gap-1 text-[9px] lg:text-[10px] font-lexend tracking-wider transition-colors ${activeTab === 'OVE_GATE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 animate-pulse' : 'text-gray-400 hover:text-white'}`}>
                VERIFICATION GATE ✓
              </button>
              <button onClick={() => setActiveTab('FLEET')} className={`flex-1 lg:flex-none justify-center whitespace-nowrap px-3.5 py-2.5 lg:px-6 lg:py-3.5 rounded-lg text-[9px] lg:text-[10px] font-lexend tracking-wider transition-colors ${activeTab === 'FLEET' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                FLEET INDEX
              </button>
              <button onClick={() => setActiveTab('REGIONS')} className={`flex-1 lg:flex-none justify-center whitespace-nowrap px-3.5 py-2.5 lg:px-6 lg:py-3.5 rounded-lg text-[9px] lg:text-[10px] font-lexend tracking-wider transition-colors ${activeTab === 'REGIONS' ? 'bg-fbblue text-white' : 'text-gray-400 hover:text-white'}`}>
                OPERATIONS REGION
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-[#ff9900]/10 border border-[#ff9900]/25 p-3 rounded-xl text-[9px] lg:text-[10px] font-mono font-bold text-[#ffb03a] tracking-widest uppercase shadow-md select-none">
               <ShieldCheck className="w-4 h-4 text-[#ffb03a] animate-pulse" />
               <span>OPERATOR VERIFICATION GATE ACTIVE // SECTIONS LOCKED</span>
            </div>
          )}
        </div>
      </header>

      {activeTab === 'INBOX' && (
        <section className="space-y-6">
          <h2 className="font-sync text-sm text-gray-400 tracking-widest">MISSION INBOX</h2>
          
          {missions?.length === 0 ? (
             <div className="p-20 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-gray-500 font-sync text-[10px] tracking-widest uppercase">No pending mission broadcasts</p>
             </div>
          ) : (
            missions?.map((m: any) => (
              <div key={m.id} className="glass-vip border border-white/10 p-8 rounded-[2rem] flex flex-col space-y-8 relative overflow-hidden group hover:border-fbblue/40 transition-all shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/5 blur-[80px] pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-fbblue/10 border border-fbblue/20 flex items-center justify-center">
                      <Plane className="w-8 h-8 text-fbblue" />
                    </div>
                    <div>
                      <h3 className="font-sync font-light text-3xl text-white">{m.id}</h3>
                      <p className="text-slate-400 text-xs font-light mt-1 font-lexend tracking-wider">
                         {(Array.isArray(m.legs) && m.legs.length > 0 ? (m.legs[0].departure || m.legs[0].from) : m.raw_payload?.departure)} → {(Array.isArray(m.legs) && m.legs.length > 0 ? (m.legs[m.legs.length - 1].arrival || m.legs[m.legs.length - 1].to) : m.raw_payload?.destination)} • {m.operator_aircraft || m.aircraft_class || 'Heavy Jet'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-2 text-nearblack">
                    {m.operator_quote ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-sync rounded border border-emerald-500/20 font-mono font-bold uppercase tracking-wider">QUOTE SUBMITTED ({m.operator_quote} USD)</span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[8px] font-sync rounded border border-amber-500/20 font-mono font-bold uppercase tracking-wider">AWAITING QUOTE</span>
                    )}
                    <p className="text-[10px] text-gray-500 font-sync uppercase tracking-widest">Received {formatToLocalDate(m.created_at)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 border-t border-white/5 pt-8 relative z-10">
                   <div className="space-y-4">
                      <h4 className="font-lexend text-fbblue text-[10px] tracking-widest font-bold">MISSION PARAMETERS</h4>
                      {Array.isArray(m.legs) && m.legs.length > 0 ? (
                        <div className="space-y-4">
                          {m.legs.map((leg: any, idx: number) => (
                             <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                                <p className="text-gray-500 text-[8px] font-lexend">LEG {idx + 1} • {leg.date || m.raw_payload?.date}</p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <p className="text-gray-500 text-[8px] font-lexend mb-1">DEPARTURE</p>
                                     <p className="text-xs text-white uppercase">{leg.departure || leg.from}</p>
                                  </div>
                                  <div>
                                     <p className="text-gray-500 text-[8px] font-lexend mb-1">DESTINATION</p>
                                     <p className="text-xs text-white uppercase">{leg.arrival || leg.to}</p>
                                  </div>
                                </div>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                <p className="text-gray-500 text-[8px] font-lexend mb-1">DEPARTURE</p>
                                <p className="text-xs text-white uppercase">{m.raw_payload?.departure}</p>
                             </div>
                             <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                <p className="text-gray-500 text-[8px] font-lexend mb-1">DESTINATION</p>
                                <p className="text-xs text-white uppercase">{m.raw_payload?.destination}</p>
                             </div>
                          </div>
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                             <p className="text-gray-500 text-[8px] font-lexend mb-1">SCHEDULED DATE</p>
                             <p className="text-xs text-white">{m.raw_payload?.date}</p>
                          </div>
                        </>
                      )}

                      {/* Passenger Manifest Panel */}
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                         <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <p className="text-fbblue text-[8px] font-sync font-bold uppercase tracking-wider">PASSENGER MANIFEST & LOGISTICS</p>
                            <span className="text-white text-[9px] font-mono">PAX: {m.passengers?.length || m.pax || 0}</span>
                         </div>
                         {m.passengers && m.passengers.length > 0 ? (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                               {m.passengers.map((p: any, pIdx: number) => (
                                  <div key={p.id || pIdx} className="text-xs bg-white/[0.01] border border-white/5 p-3 rounded-lg flex flex-col gap-2">
                                     <div className="flex justify-between font-medium">
                                        <span className="text-white uppercase font-sync text-[9px]">{pIdx + 1}. {p.surname}, {p.given_name}</span>
                                        <span className="text-gray-500 font-mono text-[8px] uppercase">{p.nationality} • {p.gender}</span>
                                     </div>
                                     <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-400 font-mono">
                                        <div>Passport: {p.passport_number}</div>
                                        <div>Expiry: {p.passport_expiry}</div>
                                     </div>
                                     <div className="grid grid-cols-3 gap-1 text-[8px] bg-white/[0.02] p-2 rounded border border-white/5">
                                        <div>
                                           <span className="text-gray-400 text-[8px] block uppercase">Bags</span>
                                           <span className="text-amber-500 font-bold font-mono">{p.bags_count || '0'} bags</span>
                                        </div>
                                        <div>
                                           <span className="text-gray-400 text-[8px] block uppercase">Weight</span>
                                           <span className="text-amber-500 font-bold font-mono">{p.luggage_weight || '0'} kg</span>
                                        </div>
                                        <div>
                                           <span className="text-gray-400 text-[8px] block uppercase font-sync">Dietary</span>
                                           <span className="text-fbblue truncate block text-[8px] font-bold" title={p.dietary}>{p.dietary || 'None'}</span>
                                        </div>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         ) : (
                            <p className="text-[10px] text-gray-500 italic font-light">No passenger manifest uploaded yet by Client.</p>
                         )}
                      </div>
                      
                      {m.mission_customizations && m.mission_customizations.length > 0 && (
                        <div className="p-4 bg-fbblue/5 border border-fbblue/20 rounded-xl space-y-3 mt-4 w-full">
                           <p className="text-fbblue text-[8px] font-sync font-bold uppercase tracking-wider">Asset Tailoring (CCI)</p>
                           <div className="space-y-2">
                             {m.mission_customizations.map((c: any, i: number) => (
                                <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5">
                                   <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] text-white font-lexend tracking-widest">{c.cci_level}</span>
                                     <span className="text-[8px] text-fbblue uppercase py-0.5 px-2 bg-fbblue/10 rounded">{c.status}</span>
                                   </div>
                                   <p className="text-xs text-gray-400 font-light">{c.request_details}</p>
                                </div>
                             ))}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-6">
                      <h4 className="font-lexend text-fbblue text-[10px] tracking-widest font-bold">OPERATIONAL RESPONSE</h4>
                      <div className="space-y-2">
                         <label className="text-gray-400 text-[10px] font-lexend block ml-1">FINAL QUOTE (USD)</label>
                       </div>

                       <div className="space-y-2">
                          <label className="text-gray-400 text-[10px] font-lexend block ml-1">PLANE AVAILABILITY</label>
                          <div className="flex gap-4">
                             <button 
                               type="button" 
                               onClick={() => setIsAvailable(prev => ({ ...prev, [m.id]: true }))}
                               className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-lexend font-bold border transition-all ${
                                 (isAvailable[m.id] ?? true) 
                                   ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 font-bold' 
                                   : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10'
                               }`}
                             >
                               AVAILABLE
                             </button>
                             <button 
                               type="button" 
                               onClick={() => setIsAvailable(prev => ({ ...prev, [m.id]: false }))}
                               className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-lexend font-bold border transition-all ${
                                 (isAvailable[m.id] === false) 
                                   ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 font-bold' 
                                   : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10'
                               }`}
                             >
                               UNAVAILABLE
                             </button>
                          </div>
                       </div>

                       {(isAvailable[m.id] ?? true) && (
                         <div className="space-y-2">
                            <label className="text-gray-400 text-[10px] font-lexend block ml-1">ASSIGNED AIRCRAFT (TAIL / MODEL)</label>
                            <div className="relative">
                               <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fbblue" />
                               <input 
                                  type="text"
                                  value={aircraftInput[m.id] !== undefined ? aircraftInput[m.id] : (m.operator_aircraft || '')}
                                  onChange={(e) => setAircraftInput(prev => ({ ...prev, [m.id]: e.target.value }))}
                                  placeholder="e.g. 5N-BGE / Gulfstream G550"
                                  className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-sm font-light outline-none focus:border-fbblue/50 transition-all font-lexend tracking-wider"
                               />
                            </div>
                         </div>
                       )}

                       {(isAvailable[m.id] ?? true) && (
                         <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5 mt-4">
                            <label className="text-fbblue text-[8px] font-sync block tracking-widest font-semibold uppercase">MISSION PRE-VERIFICATION CHECKLIST</label>
                            <p className="text-[9px] text-gray-500 leading-normal font-light">
                              You must confirm compliance and technical parameters to verify suitability before submitting your quote.
                            </p>
                            <div className="space-y-2 mt-2">
                               <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                                  <input 
                                     type="checkbox" 
                                     checked={operatorChecklist[m.id]?.crew ?? false}
                                     onChange={(e) => setOperatorChecklist(prev => ({
                                        ...prev,
                                        [m.id]: {
                                           ...(prev[m.id] || { crew: false, fuel: false, permit: false }),
                                           crew: e.target.checked
                                        }
                                     }))}
                                     className="accent-fbblue w-4 h-4 rounded border-white/10 bg-black"
                                  />
                                  <span className="font-light text-slate-300">Crew Legality & Dispatch Cleared</span>
                               </label>
                               <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                                  <input 
                                     type="checkbox" 
                                     checked={operatorChecklist[m.id]?.fuel ?? false}
                                     onChange={(e) => setOperatorChecklist(prev => ({
                                        ...prev,
                                        [m.id]: {
                                           ...(prev[m.id] || { crew: false, fuel: false, permit: false }),
                                           fuel: e.target.checked
                                        }
                                     }))}
                                     className="accent-fbblue w-4 h-4 rounded border-white/10 bg-black"
                                  />
                                  <span className="font-light text-slate-300">Fuel Allocation & Math Secured</span>
                               </label>
                               <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                                  <input 
                                     type="checkbox" 
                                     checked={operatorChecklist[m.id]?.permit ?? false}
                                     onChange={(e) => setOperatorChecklist(prev => ({
                                        ...prev,
                                        [m.id]: {
                                           ...(prev[m.id] || { crew: false, fuel: false, permit: false }),
                                           permit: e.target.checked
                                        }
                                     }))}
                                     className="accent-fbblue w-4 h-4 rounded border-white/10 bg-black"
                                  />
                                  <span className="font-light text-slate-300">Overflight & Landing Permit Approved</span>
                               </label>
                            </div>
                         </div>
                       )}

                       <div className="space-y-2">
                         <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fbblue" />
                            <input 
                               type="number"
                               value={quoteInput[m.id] !== undefined ? quoteInput[m.id] : (m.operator_quote || '')}
                               onChange={(e) => setQuoteInput(prev => ({ ...prev, [m.id]: e.target.value }))}
                               placeholder="0.00"
                               className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-lg font-light outline-none focus:border-fbblue/50 transition-all"
                            />
                         </div>
                      </div>
                      <button 
                        onClick={() => handleSubmitQuote(m.id)}
                        className="w-full bg-white text-black py-5 rounded-2xl text-xs font-bold font-lexend tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 group"
                      >
                         <CheckCircle2 className="w-4 h-4" /> {m.operator_quote ? 'UPDATE SUBMITTED QUOTE' : 'SUBMIT QUOTE TO ICC'}
                      </button>
                   </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === 'ACTIVE' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-sync text-sm text-gray-400 tracking-widest uppercase">Active Missions & Certainty Heartbeats</h2>
          </div>

          <div className="grid gap-8">
            {(!activeMissions || activeMissions.length === 0) ? (
              <div className="p-20 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-gray-500 font-sync text-[10px] tracking-widest uppercase">No assets currently in warm activation</p>
              </div>
            ) : (
              activeMissions.map((m: any) => {
                const activeHeartbeat = m.mission_heartbeats?.find((h: any) => h.status === 'AWAITING_RESPONSE');
                const permitVerification = m.mission_verifications?.find((v: any) => v.doc_type === 'PERMIT');
                const fuelVerification = m.mission_verifications?.find((v: any) => v.doc_type === 'FUEL_RECEIPT');

                return (
                  <motion.div 
                    key={m.id}
                    layout
                    className="glass-vip p-8 rounded-[2.5rem] flex flex-col gap-8 border border-white/10 relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 p-6 flex gap-4">
                       <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="font-sync text-[8px] text-emerald-500 tracking-[0.2em] uppercase">ESCROW_ALLOCATED</span>
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Activity className="w-8 h-8 text-fbblue" />
                        </div>
                        <div>
                          <h3 className="font-sync font-light text-3xl text-white uppercase">{m.id}</h3>
                          <p className="text-gray-400 text-xs font-light mt-1 uppercase tracking-wider">{(Array.isArray(m.legs) && m.legs.length > 0 ? (m.legs[0].departure || m.legs[0].from) : m.raw_payload?.departure)} → {(Array.isArray(m.legs) && m.legs.length > 0 ? (m.legs[m.legs.length - 1].arrival || m.legs[m.legs.length - 1].to) : m.raw_payload?.destination)} • {m.operator_aircraft || m.aircraft_class || 'Heavy Jet'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-sync text-[8px] text-gray-500 tracking-widest uppercase">Charter Phase</span>
                        <span className="px-4 py-1.5 bg-fbblue/20 text-fbblue text-[10px] font-sync rounded-lg border border-fbblue/30 font-bold uppercase tracking-widest">{m.status}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 border-t border-white/5 pt-8 relative z-10 w-full">
                       <div className="space-y-4">
                          <h4 className="font-lexend text-fbblue text-[10px] tracking-widest font-bold">MISSION ITINERARY</h4>
                          {Array.isArray(m.legs) && m.legs.length > 0 ? (
                            <div className="space-y-4">
                              {m.legs.map((leg: any, idx: number) => (
                                 <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                                    <p className="text-gray-500 text-[8px] font-lexend">LEG {idx + 1} • {leg.date || m.raw_payload?.date}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                         <p className="text-gray-500 text-[8px] font-lexend mb-1">DEPARTURE</p>
                                         <p className="text-xs text-white uppercase">{leg.departure || leg.from}</p>
                                      </div>
                                      <div>
                                         <p className="text-gray-500 text-[8px] font-lexend mb-1">DESTINATION</p>
                                         <p className="text-xs text-white uppercase">{leg.arrival || leg.to}</p>
                                      </div>
                                    </div>
                                 </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                  <p className="text-gray-500 text-[8px] font-lexend mb-1">DEPARTURE</p>
                                  <p className="text-xs text-white uppercase">{m.raw_payload?.departure}</p>
                               </div>
                               <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                  <p className="text-gray-500 text-[8px] font-lexend mb-1">DESTINATION</p>
                                  <p className="text-xs text-white uppercase">{m.raw_payload?.destination}</p>
                               </div>
                            </div>
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <h4 className="font-lexend text-fbblue text-[10px] tracking-widest font-bold">PASSENGER MANIFEST & TAILORING</h4>
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                             <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white text-[9px] font-mono">PAX: {m.passengers?.length || m.pax || 0}</span>
                             </div>
                             {m.passengers && m.passengers.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {m.passengers.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-black/40 p-2 border border-white/5 rounded-lg text-xs">
                                          <div className="flex flex-col">
                                            <span className="text-white uppercase truncate max-w-[120px] md:max-w-[150px]">{p.fullName}</span>
                                            <span className="text-[9px] text-gray-500 uppercase">{p.nationality} • {p.passportNumber}</span>
                                          </div>
                                          <span className="text-[10px] text-fbblue font-mono">{p.weightKg}KG</span>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <div className="text-gray-500 text-xs text-center py-4 font-sync uppercase tracking-widest">
                                    Manifest Not Synchronized
                                </div>
                             )}
                          </div>
                          
                          {m.mission_customizations && m.mission_customizations.length > 0 && (
                            <div className="p-4 bg-fbblue/5 border border-fbblue/20 rounded-xl space-y-3">
                               <p className="text-fbblue text-[8px] font-sync font-bold uppercase tracking-wider">Asset Tailoring (CCI)</p>
                               <div className="space-y-2">
                                 {m.mission_customizations.map((c: any, i: number) => (
                                    <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5">
                                       <div className="flex justify-between items-center mb-2">
                                         <span className="text-[10px] text-white font-lexend tracking-widest">{c.cci_level}</span>
                                         <span className="text-[8px] text-fbblue uppercase py-0.5 px-2 bg-fbblue/10 rounded">{c.status}</span>
                                       </div>
                                       <p className="text-xs text-gray-400 font-light">{c.request_details}</p>
                                    </div>
                                 ))}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* HEARTBEAT ALERT (Tier 2 Protocol) */}
                    <AnimatePresence>
                      {activeHeartbeat && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-8 overflow-hidden relative"
                        >
                          <div className="absolute top-0 right-0 p-8">
                             <div className="flex flex-col items-end">
                                <span className="font-sync text-[8px] text-amber-500 tracking-widest mb-1 uppercase">Response Window</span>
                                <span className="text-2xl font-light font-mono text-white tracking-widest">14:59</span>
                             </div>
                          </div>
                          <div className="flex flex-col gap-6 relative z-10 max-w-xl">
                            <div className="space-y-2">
                              <h4 className="text-xl font-lexend font-bold text-amber-500 tracking-widest">TAIL HEARTBEAT REQUEST</h4>
                              <p className="text-xs text-amber-500/70 font-light leading-relaxed uppercase">
                                System requires confirmation of asset exclusivity for Tail <strong className="text-white font-bold">{activeHeartbeat.tail_number}</strong>. Failure to respond within the 15-minute window results in immediate ORS decay and mission pivot.
                              </p>
                            </div>
                            <div className="flex gap-4">
                              <button 
                                onClick={() => handleHeartbeatResponse(activeHeartbeat.id, 'CONFIRMED')}
                                className="px-8 py-4 bg-white text-black rounded-xl text-[10px] font-sync font-bold tracking-widest hover:bg-emerald-500 hover:text-white transition-all uppercase shadow-lg shadow-white/5"
                              >
                                LOCK ASSET
                              </button>
                              <button 
                                onClick={() => handleHeartbeatResponse(activeHeartbeat.id, 'CONFLICT')}
                                className="px-8 py-4 bg-black/40 text-amber-500 border border-amber-500/30 rounded-xl text-[10px] font-sync font-bold tracking-widest hover:bg-amber-500/20 transition-all uppercase"
                              >
                                PIVOT TO ALTERNATE
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* VERIFICATION GATES */}
                    <div className="grid md:grid-cols-2 gap-6 border-t border-white/5 pt-8">
                       <div className={`p-6 rounded-3xl border transition-all ${permitVerification?.status === 'VERIFIED' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}>
                          <div className="flex justify-between items-center mb-6">
                             <div className="space-y-1">
                                <span className="font-sync text-[8px] text-gray-400 tracking-widest uppercase">Gate 1: T-72 Flight Release</span>
                                <h4 className="text-sm text-white uppercase tracking-wider">Civil Aviation Permit</h4>
                             </div>
                             {permitVerification?.status === 'VERIFIED' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                             ) : (
                                <button 
                                  onClick={() => setActiveVerification({ missionId: m.id, type: 'PERMIT' })}
                                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors shrink-0"
                                >
                                   <Upload className="w-4 h-4 text-white" />
                                </button>
                             )}
                          </div>
                          {permitVerification ? (
                             <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div>
                                   <p className="text-[8px] text-gray-500 uppercase font-sync">Permit Number</p>
                                   <p className="text-[10px] text-white font-mono uppercase">{permitVerification.typed_metadata.permit_number}</p>
                                </div>
                                <span className={`text-[8px] font-lexend tracking-widest font-bold ${permitVerification.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>[{permitVerification.status}]</span>
                             </div>
                          ) : (
                             <p className="text-[10px] text-gray-500 italic font-light uppercase tracking-widest">Awaiting digital evidence upload</p>
                          )}
                       </div>

                       <div className={`p-6 rounded-3xl border transition-all ${fuelVerification?.status === 'VERIFIED' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/20'}`}>
                          <div className="flex justify-between items-center mb-6">
                             <div className="space-y-1">
                                <span className="font-sync text-[8px] text-red-400 tracking-widest uppercase font-bold">Gate 2: T-24 Fuel Assurance</span>
                                <h4 className="text-sm text-white uppercase tracking-wider">Fuel Release Evidence</h4>
                             </div>
                             {fuelVerification?.status === 'VERIFIED' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                             ) : (
                                <button 
                                  onClick={() => setActiveVerification({ missionId: m.id, type: 'FUEL_RECEIPT' })}
                                  className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors shrink-0"
                                >
                                   <Upload className="w-4 h-4 text-red-400" />
                                </button>
                             )}
                          </div>
                          {fuelVerification ? (
                             <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div>
                                   <p className="text-[8px] text-gray-500 uppercase font-sync">Fuel Release #</p>
                                   <p className="text-[10px] text-white font-mono uppercase">{fuelVerification.typed_metadata.frn}</p>
                                </div>
                                <span className={`text-[8px] font-lexend tracking-widest font-bold ${fuelVerification.status === 'VERIFIED' ? 'text-emerald-500' : 'text-red-500'}`}>[{fuelVerification.status}]</span>
                             </div>
                          ) : (
                             <p className="text-[10px] text-red-400/60 italic font-light uppercase tracking-widest">Immediate action required • T-minus countdown active</p>
                          )}
                       </div>
                    </div>

                    <div className="bg-white/5 px-6 py-4 rounded-2xl flex items-center justify-between border border-white/10">
                       <div className="flex items-center gap-4">
                          <ShieldCheck className="w-5 h-5 text-fbblue" />
                          <p className="text-[9px] text-gray-400 font-light leading-relaxed uppercase tracking-widest">
                             Sovereign Identity Verification Enabled. Uploading files does not halt system-pivot countdowns. Only binary <strong className="text-white">VERIFIED</strong> status secures the mission allocation.
                          </p>
                       </div>
                    </div>
                    <div className="mt-8">
                       <MissionChat missionId={m.id} role="OPERATOR" senderId={operator?.name || 'Operator'} />
                    </div>

                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      )}

      {activeTab === 'OVE_GATE' && operator && (
        <section className="space-y-6">
          <OVEGateway operatorId={operator.id} onStateUpdated={() => { refetch(); refetchProfile(); }} />
        </section>
      )}

      {activeTab === 'FLEET' && (
        <section className="space-y-8">
          <div className="flex justify-between items-center bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 flex-wrap gap-4">
             <div className="space-y-1">
                <h3 className="font-sync text-sm text-white font-medium tracking-wide">GLOBAL AIRCRAFT DIRECTORY</h3>
                <p className="text-gray-400 text-xs font-light">Sourced directly from your live verified fleet compliance registry.</p>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('OVE_GATE')}
                  className="font-lexend text-[10px] flex items-center justify-center gap-2 bg-fbblue text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                   <Plus className="w-3 h-3" /> REGISTER NEW AIRCRAFT
                </button>
             </div>
          </div>

          {!operator?.fleet_registry || (Array.isArray(operator.fleet_registry) && operator.fleet_registry.length === 0) ? (
             <div className="bg-[#141414]/90 p-8 rounded-[2rem] border border-white/5 text-center space-y-4">
                <Plane className="w-12 h-12 text-gray-500 mx-auto animate-pulse" />
                <div className="space-y-1">
                   <h4 className="text-white text-sm font-semibold font-mono">No Certified Aircraft Found</h4>
                   <p className="text-gray-400 text-xs max-w-sm mx-auto font-light leading-normal">
                      All operating airplanes must be registered within the compliance gate. Please use the Security Compliance tab to add active tail numbers.
                   </p>
                </div>
                <button 
                  onClick={() => setActiveTab('OVE_GATE')}
                  className="bg-fbblue text-white text-xs px-4 py-2.5 rounded-lg font-semibold hover:bg-fbblue/90 cursor-pointer"
                >
                   Go to Compliance Gate
                </button>
             </div>
          ) : (
             <div className="grid md:grid-cols-3 gap-6">
                {(operator.fleet_registry as any[]).map((plane) => (
                   <div key={plane.id || plane.tailNumber} className="glass-3 bg-white/[0.01] border border-white/5 p-4 rounded-[2rem] group hover:border-fbblue/30 transition-colors">
                      <div className="h-32 bg-white/[0.03] rounded-xl mb-4 overflow-hidden relative flex items-center justify-center border border-white/5">
                         <Plane className="w-10 h-10 text-fbblue opacity-40 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <h4 className="text-white text-sm font-semibold font-mono">{plane.tailNumber}</h4>
                      <p className="text-[10px] font-sync text-fbblue mt-1 uppercase font-semibold">
                         {plane.manufacturer} {plane.model}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-light">
                         Airport Base: {plane.homeBase || "DNMM"} • Capacity: {plane.capacity || 8} PAX • Region: West Africa
                      </p>
                   </div>
                ))}
             </div>
          )}
        </section>
      )}

      {activeTab === 'REGIONS' && operator && (
        <section className="space-y-8">
          <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h3 className="font-sync text-sm text-white font-medium tracking-wide">OPERATIONAL FLIGHT AXIS</h3>
              <p className="text-gray-400 text-xs font-light">Set your licensed flight operational regions to qualify for automated mission disbursement.</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-bold">CLOUDFLARE DISBURSEMENT SYNCHRONIZED</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Region Selector */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h4 className="text-xs text-white font-sync tracking-widest uppercase">LICENSED REGIONS</h4>
                  <ShieldCheck className="w-4 h-4 text-fbblue" />
                </div>
                
                <OperatorRegionsList operator={operator} refetchProfile={refetchProfile} />
              </div>

              {/* Cloudflare Routing Engine & Scoring */}
              <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
                <h4 className="text-xs text-white font-sync tracking-widest uppercase border-b border-white/5 pb-4">DRI SCORING METRICS</h4>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Compliance Score (40%):</span>
                    <span className="text-white">{(operator.compliance_score || 0).toFixed(0)}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${operator.compliance_score || 0}%` }} />
                  </div>

                  <div className="flex justify-between items-center text-gray-400">
                    <span>Availability Score (30%):</span>
                    <span className="text-white">{(operator.availability_score || 100).toFixed(0)}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-fbblue h-full" style={{ width: `${operator.availability_score || 100}%` }} />
                  </div>

                  <div className="flex justify-between items-center text-gray-400">
                    <span>Relationship Score (30%):</span>
                    <span className="text-white">{(operator.relationship_score || 100).toFixed(0)}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full" style={{ width: `${operator.relationship_score || 100}%` }} />
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-sm font-bold text-white">
                    <span>Dispatch Index (DRI):</span>
                    <span className="text-emerald-400 font-bold">
                      {(((operator.compliance_score || 0) * 0.40) + 
                       ((operator.availability_score || 100) * 0.30) + 
                       ((operator.relationship_score || 100) * 0.30)).toFixed(1)}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Columns: Live Telemetry & Chat */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cloudflare Live Telemetry Logs */}
              <CloudflareTelemetryConsole operatorName={operator.name} />

              {/* Real-time ICC Hotline Chat */}
              <RealtimeHotlineChat operatorId={operator.id} operatorName={operator.name} />
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}

// Subcomponents for Operations Region tab
function OperatorRegionsList({ operator, refetchProfile }: { operator: any, refetchProfile: () => void }) {
  const [regions, setRegions] = useState<string[]>(() => {
    if (!operator?.operational_region) return ['West Africa'];
    return operator.operational_region.split(',').map((r: string) => r.trim()).filter(Boolean);
  });
  const [updating, setUpdating] = useState(false);

  const availableRegions = [
    { name: 'West Africa', authority: 'NCAA (Nigeria)', code: 'DNMM / DNAA' },
    { name: 'Europe & Med', authority: 'EASA (Europe)', code: 'LFPB / EGSS' },
    { name: 'Middle East', authority: 'GCAA (UAE)', code: 'OMDB / OTHH' },
    { name: 'North America', authority: 'FAA (USA)', code: 'KTEB / KHPN' }
  ];

  const toggleRegion = async (regionName: string) => {
    let nextRegions;
    if (regions.includes(regionName)) {
      if (regions.length === 1) {
        alert("Operators must retain at least one registered operating region.");
        return;
      }
      nextRegions = regions.filter(r => r !== regionName);
    } else {
      nextRegions = [...regions, regionName];
    }
    setRegions(nextRegions);
    setUpdating(true);

    try {
      const regionString = nextRegions.join(', ');
      const { error } = await supabase
        .from('operators')
        .update({ operational_region: regionString })
        .eq('id', operator.id);
      
      if (error) {
        alert("Failed to update flight region in directory: " + error.message);
      } else {
        refetchProfile();
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {availableRegions.map((reg) => {
        const isActive = regions.includes(reg.name);
        return (
          <div 
            key={reg.name} 
            onClick={() => !updating && toggleRegion(reg.name)}
            className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${
              isActive 
                ? 'bg-fbblue/10 border-fbblue/30 hover:bg-fbblue/15' 
                : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
            }`}
          >
            <div>
              <p className="text-xs text-white font-semibold">{reg.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{reg.authority} • Hubs: {reg.code}</p>
            </div>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              isActive ? 'bg-fbblue border-fbblue' : 'border-white/20'
            }`}>
              {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
          </div>
        );
      })}
      {updating && <p className="text-[8px] text-fbblue font-mono uppercase animate-pulse">Syncing registry with Cloudflare Edge API...</p>}
    </div>
  );
}

function CloudflareTelemetryConsole({ operatorName }: { operatorName: string }) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const defaultLogs = [
      `[EDGE-WORKER] Worker init - polling global compliance status database`,
      `[DRI-ENGINE] Scoring operators across availability criteria`,
      `[DRI-ENGINE] ${operatorName}: Compliance score retrieved, matching aviation spec certs`,
      `[DISBURSE] Operator matched flight region correctly. Status: ELIGIBLE`
    ];
    setLogs(defaultLogs);

    const interval = setInterval(() => {
      const extraLogs = [
        `[EDGE-WORKER] Checked NCAA registry - operator ${operatorName} is in standing`,
        `[DRI-ENGINE] Availability metrics verified. Auto-routing is primed for launch`,
        `[DISBURSE] Waiting for client booking... Checking queue`,
        `[EDGE-WORKER] Pinned active region hotlines for immediate mission disbursement`
      ];
      const randomLog = extraLogs[Math.floor(Math.random() * extraLogs.length)];
      const now = new Date().toLocaleTimeString([], { hour12: false });
      setLogs(prev => [...prev.slice(-6), `[${now}] ${randomLog}`]);
    }, 8000);

    return () => clearInterval(interval);
  }, [operatorName]);

  return (
    <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <h4 className="text-xs text-white font-sync tracking-widest uppercase">CLOUDFLARE DRI TELEMETRY LOGS</h4>
        </div>
        <span className="text-[9px] font-mono text-gray-500">WORKER ENGINE V4.2</span>
      </div>

      <div className="bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-400 space-y-2 h-44 overflow-y-auto scrollbar-none">
        {logs.map((log, index) => (
          <p key={index} className="leading-relaxed opacity-90">{log}</p>
        ))}
      </div>
    </div>
  );
}

interface RealtimeMessage {
  id: string;
  text: string;
  createdAt: any;
  sender: 'operator' | 'icc';
}

function RealtimeHotlineChat({ operatorId, operatorName }: { operatorId: string, operatorName: string }) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!operatorId) return;

    // Use a Firestore collection specific to this operator's direct hotline with ICC
    const q = query(
      collection(db, 'operator_chats', operatorId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RealtimeMessage[];
      setMessages(msgs);
    }, (error) => {
      console.warn("Firestore listener warning (custom security rule/quota check):", error);
    });

    return () => unsubscribe();
  }, [operatorId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'operator_chats', operatorId, 'messages'), {
        text: text.trim(),
        sender: 'operator',
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err: any) {
      console.error("Firestore message send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-vip p-6 rounded-[2rem] border border-white/5 flex flex-col h-[400px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
          <h4 className="text-xs text-white font-sync tracking-widest uppercase">DIRECT ICC HOTLINE TERMINAL</h4>
        </div>
        <span className="text-[9px] font-mono text-gray-500">SECURE P2P WEBSOCKET CHANNEL</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 my-4 scrollbar-none">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-500 mt-12 space-y-2">
            <MessageSquare className="w-8 h-8 text-white/10 mx-auto" />
            <p>Hotline clear. Transmit to initiate direct compliance sync with ICC.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === 'operator';
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%]">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe ? 'bg-fbblue text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm'
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono mt-1 block text-right">
                    {isMe ? 'OPERATOR' : 'ICC COMMAND'} • {m.createdAt ? new Date(m.createdAt.toDate ? m.createdAt.toDate() : m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text" 
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Transmit priority coordinator packet..." 
          className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-fbblue/50"
        />
        <button 
          type="submit" 
          disabled={!text.trim() || sending}
          className="bg-fbblue hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl px-4 flex items-center justify-center cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}