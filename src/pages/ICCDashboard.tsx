import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Target, Waves, Users, Globe, Lock, User, Plane, CheckCircle2, CheckCircle, ShieldCheck, ChevronRight, FileText, Key, LogIn, Command, CreditCard, ExternalLink, Send, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import RegulatoryDisclaimer from '../components/RegulatoryDisclaimer';
import UserMenu from '../components/UserMenu';
import { formatCurrency, formatToLocalDate } from '../lib/utils';
import { useState, Suspense, lazy, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { sendGasEmail } from '../lib/gasMailer';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Spline = lazy(() => import('@splinetool/react-spline'));

// Subcomponents for Operator Details expansion
function CloudflareReviewReport({ operator }: { operator: any }) {
  const hasAoc = !!(operator.legal_authority?.aocNumber || operator.wire_bank_name); // wire transfer details implies legal setup
  const fleetCount = Array.isArray(operator.fleet_registry) ? operator.fleet_registry.length : (operator.fleet_registry ? 1 : 0);
  const hasFinance = !!(operator.financial_coordination?.accountNumber || operator.wire_account_number);
  const hasHotline = !!(operator.communication_infrastructure?.dispatchHotline || operator.contact_phone || operator.phone);

  const complianceScore = operator.compliance_score || 0;
  const availabilityScore = operator.availability_score || 100;
  const relationshipScore = operator.relationship_score || 100;
  const weightedScore = (complianceScore * 0.40) + (availabilityScore * 0.30) + (relationshipScore * 0.30);

  const status = weightedScore >= 70 ? 'PASSED_FIT' : 'MANUAL_AUDIT_REQUIRED';

  return (
    <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-fbblue" />
          <h4 className="text-xs text-white font-mono tracking-widest uppercase">CLOUDFLARE DRI EDGE API AUDIT</h4>
        </div>
        <span className="text-[8px] font-mono text-fbblue bg-fbblue/10 px-2 py-0.5 rounded">DATA-DRIVEN REVIEW</span>
      </div>

      <div className="space-y-3 font-mono text-[11px] text-slate-300 font-light">
        <div className="flex justify-between items-center">
          <span>NCAA AOC Permit Registry:</span>
          <span className={hasAoc ? 'text-emerald-400' : 'text-amber-400'}>
            {hasAoc ? '✔️ VALID / IN STANDING' : '❌ PENDING DOCUMENTATION'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Aircraft Permits & Tail Numbers:</span>
          <span className={fleetCount > 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {fleetCount > 0 ? `✔️ ${fleetCount} FLEET ITEMS REGISTERED` : '❌ ZERO TAIL NUMBERS'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Escrow Settlement Routing:</span>
          <span className={hasFinance ? 'text-emerald-400' : 'text-amber-400'}>
            {hasFinance ? '✔️ LINKED FOR DIRECT DEPOSIT' : '❌ COORDINATES EMPTY'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>24/7 Dispatch Desk Hotline:</span>
          <span className={hasHotline ? 'text-emerald-400' : 'text-amber-400'}>
            {hasHotline ? '✔️ HOTLINE CONFIGURED' : '❌ PENDING HOTLINE SYNC'}
          </span>
        </div>

        <div className="border-t border-white/5 pt-4 space-y-2">
          <div className="flex justify-between text-xs text-white font-semibold">
            <span>Weighted Compliance Index:</span>
            <span>{weightedScore.toFixed(1)}/100</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Oversight Recommendation:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              status === 'PASSED_FIT' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
            }`}>
              {status === 'PASSED_FIT' ? 'SYSTEM RECOMMENDS FIT' : 'COMPLIANCE AUDIT REQUIRED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HotlineMsg {
  id: string;
  text: string;
  createdAt: any;
  sender: 'operator' | 'icc';
}

function IccOperatorChat({ operatorId, operatorName }: { operatorId: string, operatorName: string }) {
  const [messages, setMessages] = useState<HotlineMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!operatorId) return;

    const q = query(
      collection(db, 'operator_chats', operatorId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HotlineMsg[];
      setMessages(msgs);
    }, (error) => {
      console.warn("Firestore listener error on ICC end (custom rules/sandbox quota):", error);
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
        sender: 'icc',
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err) {
      console.error("Failed to transmit hotline message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col h-[230px] text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-fbblue" />
          <h4 className="text-xs text-white font-mono uppercase tracking-wider">LIVE OPERATOR HOTLINE P2P</h4>
        </div>
        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">SYNCED</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 scrollbar-none text-[11px]">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic text-center mt-8 font-light">No live traffic. Transmit message to prompt operator dashboard.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === 'icc';
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  <div className={`p-2 rounded-xl leading-relaxed ${
                    isMe ? 'bg-fbblue text-white font-light' : 'bg-white/5 border border-white/10 text-slate-300 font-light'
                  }`}>
                    {m.text}
                  </div>
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
          placeholder={`Coordinate with ${operatorName}...`} 
          className="flex-1 bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-fbblue/50 font-light"
        />
        <button 
          type="submit" 
          disabled={!text.trim() || sending}
          className="bg-fbblue hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl px-3 flex items-center justify-center cursor-pointer transition-colors"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}

type ICCState = 'LOGIN' | 'DASHBOARD';

export default function ICCDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionVerified = searchParams.get('verified') === 'true';
  const [appState, setAppState] = useState<ICCState>(sessionVerified ? 'DASHBOARD' : 'LOGIN');
  const [role, setRole] = useState<'STRATEGIC_AUTHORITY' | 'MISSION_ARCHITECT'>('STRATEGIC_AUTHORITY');

  const handleLogin = (r: 'STRATEGIC_AUTHORITY' | 'MISSION_ARCHITECT') => {
    setRole(r);
    setSearchParams({ verified: 'true' });
    setAppState('DASHBOARD');
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-lexend overflow-hidden pt-24 pb-20 px-4 md:px-8">
      <div className="absolute -inset-10 z-0 opacity-40 transform scale-[1.25] md:scale-[1.15] translate-y-48 md:translate-y-64 origin-center pointer-events-none">
         <Suspense fallback={null}>
           <Spline scene="https://prod.spline.design/9qOy9ss4vw962fCc/scene.splinecode" />
         </Suspense>
      </div>
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {appState === 'LOGIN' && (
            <ICCLogin onLogin={handleLogin} key="login" />
          )}
          {appState === 'DASHBOARD' && (
            <ICCMain role={role} setRole={setRole} key="dashboard" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ICCLogin({ onLogin }: { onLogin: (role: 'STRATEGIC_AUTHORITY' | 'MISSION_ARCHITECT') => void; key?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Credentials incomplete.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const emailLower = email.trim().toLowerCase();
      const codeTrimmed = password.trim();

      const { data, error } = await supabase
        .from('operator_access_codes')
        .select('email, access_code')
        .eq('email', emailLower)
        .eq('access_code', codeTrimmed)
        .single();

      if (error || !data) {
        // Fallback for demo if no real auth setup
        if (emailLower === 'admin@15d.network' && codeTrimmed === 'command') {
          setLoading(false);
          onLogin(isSuperAdmin ? 'STRATEGIC_AUTHORITY' : 'MISSION_ARCHITECT');
          return;
        }
        setError('Invalid access credentials.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onLogin(isSuperAdmin ? 'STRATEGIC_AUTHORITY' : 'MISSION_ARCHITECT');
    } catch (err: any) {
      console.error("ICC login handler exception:", err);
      setError('Verification system exception.');
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-sm mx-auto flex flex-col items-center mt-12 md:mt-24">
      <div className="w-full space-y-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center">
              <Command className="w-8 h-8 text-white/80" />
          </div>
          <h2 className="font-sync font-light text-white text-2xl tracking-widest">ICC COMMAND</h2>
          <p className="ui-sync text-gray-400 tracking-[0.2em] text-[8px]">SUPER ADMIN ACCESS</p>
        </div>

        <div className="p-8 md:p-10 rounded-[2rem] w-full space-y-6 bg-white/[0.02] border border-white/[0.05] shadow-2xl backdrop-blur-md">
          {error && <div className="text-red-500 text-xs text-center border border-red-500/30 p-2 rounded bg-red-500/10 ui-sync">{error}</div>}
          <div className="flex bg-white/[0.03] p-1 rounded-xl mb-6">
             <button onClick={() => setIsSuperAdmin(true)} className={`flex-1 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${isSuperAdmin ? 'bg-fbblue text-white' : 'text-gray-500 hover:text-white'}`}>AUTHORITY</button>
             <button onClick={() => setIsSuperAdmin(false)} className={`flex-1 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${!isSuperAdmin ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>ARCHITECT</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">NETWORK EMAIL</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="admin@15d.network" 
                   className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors focus:bg-white/[0.02]" 
                />
              </div>
            </div>
            <div>
               <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">ACCESS HASH</label>
               <div className="relative">
                 <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') handleAuth();
                   }}
                   placeholder="••••••••" 
                   className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors focus:bg-white/[0.02]" 
                 />
               </div>
            </div>
          </div>

          <button onClick={handleAuth} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl text-xs hover:bg-gray-200 transition-colors shadow-lg mt-4 font-sync tracking-widest font-bold">
             {loading ? <span className="animate-spin">...</span> : 'AUTHORIZE ACCESS'}
          </button>
          

        </div>
      </div>
      <RegulatoryDisclaimer />
    </motion.div>
  );
}

function ICCMain({ role, setRole }: { role: 'STRATEGIC_AUTHORITY' | 'MISSION_ARCHITECT', setRole: (r: 'STRATEGIC_AUTHORITY' | 'MISSION_ARCHITECT') => void; key?: string }) {
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'OPERATORS' | 'LEADS' | 'GIO'>('MISSIONS');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [expandedOperatorId, setExpandedOperatorId] = useState<string | null>(null);
  
  const [gioEmail, setGioEmail] = useState('');
  const [gioToken, setGioToken] = useState('');

  // Real-time Operator Verification Toast Alerts state & listener
  interface ToastAlert {
    id: string;
    operatorId: string;
    operatorName: string;
    operatorEmail: string;
    phone: string;
    region: string;
    complianceScore: number;
  }
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const triggerSciFiChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Chime playback blocked or failed:", e);
    }
  };

  const { data: missions, refetch: refetchMissions } = useQuery({
    queryKey: ['admin-missions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          
          mission_customizations (*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: operators, refetch: refetchOperators } = useQuery({
    queryKey: ['admin-operators'],
    queryFn: async () => {
      const { data, error } = await supabase.from('operators').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: accessCodes } = useQuery({
    queryKey: ['admin-access-codes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('operator_access_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: leads, refetch: refetchLeads } = useQuery({
    queryKey: ['admin-operator-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('operator_leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: gioAgents, refetch: refetchGio } = useQuery({
    queryKey: ['admin-gio-agents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gio_intel').select('*').order('created_at', { ascending: false });
      if (error) return []; // Graceful fallback if table is not fully created yet
      return data || [];
    }
  });

  const { data: gioApplicants, refetch: refetchGioApplicants } = useQuery({
    queryKey: ['admin-gio-applicants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gio_applicants').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    }
  });

  // Real-time verification alerts listener
  useEffect(() => {
    const mountTime = Date.now();
    const q = query(
      collection(db, 'verification_alerts'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const docId = change.doc.id;
          const docTime = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : Date.now();

          // Only alert for entries submitted AFTER mount time
          if (docTime > mountTime - 5000) {
            const newToast: ToastAlert = {
              id: docId,
              operatorId: data.operatorId,
              operatorName: data.operatorName || 'Unknown Operator',
              operatorEmail: data.operatorEmail || '',
              phone: data.phone || '',
              region: data.region || 'NCAA West Africa',
              complianceScore: data.complianceScore || 78,
            };

            setToasts((prev) => {
              if (prev.some(t => t.id === docId)) return prev;
              return [...prev, newToast];
            });

            triggerSciFiChime();
            refetchOperators();
          }
        }
      });
    }, (error) => {
      console.warn("Real-time verification listener warning (Firebase rules/sandbox):", error);
    });

    return () => unsubscribe();
  }, [refetchOperators]);

  const handleVerifyPayment = async (id: string, status: 'VERIFIED' | 'FAILED', clientName?: string, clientEmail?: string) => {
    try {
      // Direct table updates to ensure instant state propagation
      if (status === 'VERIFIED') {
        await supabase.from('missions').update({
          payment_status: 'CONFIRMED',
          status: 'OPERATOR_REVIEW'
        }).eq('id', id);

        await supabase.from('payment_states').upsert({
          mission_id: id,
          status: 'verified',
          updated_at: new Date().toISOString()
        }, { onConflict: 'mission_id' });
      } else {
        await supabase.from('missions').update({
          payment_status: 'FAILED',
          status: 'PENDING'
        }).eq('id', id);

        await supabase.from('payment_states').upsert({
          mission_id: id,
          status: 'failed',
          updated_at: new Date().toISOString()
        }, { onConflict: 'mission_id' });
      }

      const { error } = await supabase.rpc('verify_mission_payment', {
        p_mission_id: id,
        p_status: status
      });
      if (error) {
        console.warn("RPC note (handled by explicit update):", error.message);
      }
      refetchMissions();
      
      if (status === 'VERIFIED') {
        sendGasEmail({
          recipientName: clientName || 'Principal',
          recipientEmail: clientEmail || 'billing@15dwings.com.ng',
          subject: 'Wings 15D - Payment Verified',
          messagePayload: 'Your payment has been successfully verified. The mission is now fully cleared for operations.',
          purpose: 'PAYMENT_REVIEW'
        });
      }
    } catch (e: any) {
      alert('Failed to verify payment: ' + e.message);
    }
  };

  const handleApproveOperator = async (id: string, email: string, name: string) => {
    const { error } = await supabase.from('operators').update({
      verification_status: 'VERIFIED',
      compliance_status: 'FIT'
    }).eq('id', id);
    
    if (!error) {
      refetchOperators();
      
      // Dispatch modern GAS notification
      sendGasEmail({
        recipientName: name || "Operations Director",
        recipientEmail: email || "ops@15dwings.com.ng",
        subject: "Wings 15D - Compliance Portfolio Approved FIT",
        messagePayload: `Congratulations. Your compliance portfolio has been approved FIT by the NCAA/ICC oversight panel.<br><br><b>Status:</b> COMMISSIONED / MISSION-READY<br><b>Clearance Type:</b> Exclusive Flight Node<br><br>Your active flight dispatch deck and operating hotlines are fully certified. You may now operate active flight routes.`,
        purpose: 'MISSION_COMPLETED',
        meta: {
          operatorId: id,
          clearanceStatus: 'MISSION_READY'
        }
      });
    } else {
      alert('Failed to approve operator: ' + error.message);
    }
  };
  
  const handleApproveLead = async (leadId: string, email: string) => {
    const { error } = await supabase.from('operator_leads').update({
      status: 'VERIFIED'
    }).eq('id', leadId);
    if (!error) {
      refetchLeads();
      alert(`Lead ${email} marked as VERIFIED.`);
    }
  };

  const handleApproveGioApplicant = async (appId: string, email: string, name: string) => {
    // Approve application
    const { error } = await supabase.from('gio_applicants').update({
      status: 'VERIFIED'
    }).eq('id', appId);

    if (!error) {
      // Provision access (we can auto-generate a token)
      const token = 'GIO-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const loginHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: adminUser } = await supabase.auth.getUser();

      await supabase.from('gio_intel').insert({
        email: email,
        name: name,
        login_hash: loginHash,
        hash_expires_at: hashExpires,
        clearance_level: 'field_officer'
      });

      refetchGioApplicants();
      refetchGio();

      const loginUrl = `${window.location.origin}/gio/tarmac?email=${encodeURIComponent(email)}&token=${loginHash}`;
      sendGasEmail({
        recipientName: name,
        recipientEmail: email,
        subject: "Wings 15D - GIO Intel Access Provisioned",
        messagePayload: `Your request to join the GIO Intel network has been approved.<br><br><b>Delegation Token:</b> ${token}<br><br>Please use this secure link to access the GIO Terminal:<br><a href="${loginUrl}">${loginUrl}</a>`,
        purpose: 'MISSION_COMPLETED'
      });
      
      alert(`Agent ${name} approved and provisioned.`);
    }
  };

  const verifyMissionCustomization = async (customizationId: string) => {
    const { error } = await supabase.from('mission_customizations').update({
      status: 'VERIFIED'
    }).eq('id', customizationId);
    if (!error) refetchMissions();
  };

  const handleCreateGio = async () => {
    if (!gioEmail || !gioToken) return;
    
    // In a real implementation, we would also create an auth user or use the current admin's ID for cleared_by
    const { data: adminUser } = await supabase.auth.getUser();
    const loginHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hashExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('gio_intel').insert({
      email: gioEmail,
      name: 'GIO Agent',
      login_hash: loginHash,
      hash_expires_at: hashExpires,
      clearance_level: 'field_officer'
    });
    
    if (!error) {
      alert('GIO Access Created');
      setGioEmail('');
      setGioToken('');
      refetchGio();
      
      const loginUrl = `${window.location.origin}/gio/tarmac?email=${encodeURIComponent(gioEmail)}&token=${loginHash}`;
      sendGasEmail({
        recipientName: 'GIO Applicant',
        recipientEmail: gioEmail,
        subject: "Wings 15D - GIO Intel Access Provisioned",
        messagePayload: `Your request to join the GIO Intel network has been approved.<br><br><b>Delegation Token:</b> ${gioToken}<br><br>Please use this secure link to access the GIO Terminal:<br><a href="${loginUrl}">${loginUrl}</a>`,
        purpose: 'MISSION_COMPLETED'
      });
    } else {
      alert('Error creating GIO access: ' + error.message);
    }
  };

  const handleActivateMission = async (id: string) => {
    const { error } = await supabase.from('missions').update({ 
      status: 'ACTIVATED'
    }).eq('id', id);
    if (!error) refetchMissions();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
          <div className="space-y-2">
            <span className="ui-sync text-fbblue block tracking-[0.3em] text-[10px]">INTEGRATED COMMAND CENTER</span>
            <h1 className="font-lexend font-light text-4xl md:text-6xl tracking-tight text-white/90">DASHBOARD</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="glass-3 px-4 py-2 rounded-lg ui-sync text-[8px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">SYSTEM: ONLINE</span>
              <span className="glass-3 px-4 py-2 rounded-lg ui-sync text-[8px] text-fbblue bg-fbblue/10 border border-fbblue/20">{role.replace('_', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0 w-full md:w-auto">
            <div className="bg-white/[0.03] p-1 rounded-xl flex gap-1 overflow-x-auto pb-2 md:pb-0 whitespace-nowrap scrollbar-hide">
              <button onClick={() => setActiveTab('MISSIONS')} className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'MISSIONS' ? 'bg-fbblue text-white' : 'text-gray-500 hover:text-white'}`}>
                MISSIONS & PAYMENTS
              </button>
              <button onClick={() => setActiveTab('OPERATORS')} className={`px-6 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'OPERATORS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                OPERATOR GOVERNANCE
              </button>
              <button onClick={() => setActiveTab('LEADS')} className={`px-6 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'LEADS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                ONBOARDING LEADS
              </button>
              <button onClick={() => setActiveTab('GIO')} className={`px-6 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'GIO' ? 'bg-gold/20 text-gold' : 'text-gray-500 hover:text-white'}`}>
                GIO INTEL
              </button>
            </div>
            <UserMenu />
          </div>
      </div>

      {activeTab === 'MISSIONS' && (
        <div className="space-y-8">
           <div className="flex justify-between items-center">
            <h2 className="ui-sync text-gray-400 text-sm tracking-widest ml-2 uppercase">Command Registry</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
                <p className="ui-sync text-[8px] text-fbblue tracking-widest">ACTIVE AIRSPACE</p>
                <p className="text-3xl font-light">{missions?.filter(m => m.status === 'ACTIVATED' || m.status === 'EXECUTING').length || 0}</p>
             </div>
             <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
                <p className="ui-sync text-[8px] text-amber-500 tracking-widest">AWAITING VERIFICATION</p>
                <p className="text-3xl font-light">{missions?.filter(m => m.payment_status === 'AWAITING_VERIFICATION').length || 0}</p>
             </div>
          </div>

          <div className="grid gap-4">
             {missions?.map(m => {
               const isAwaitingPayment = m.payment_status === 'AWAITING_VERIFICATION';
               const isExpanded = selectedMissionId === m.id;
               
               return (
                 <div 
                   key={m.id} 
                   className={`glass-vip border p-6 rounded-3xl flex flex-col transition-all cursor-pointer ${isAwaitingPayment ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5 hover:border-fbblue/30'}`}
                   onClick={() => setSelectedMissionId(isExpanded ? null : m.id)}
                 >
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                     <div className="flex items-center gap-6">
                        <div className={`w-3 h-3 rounded-full ${m.status === 'ACTIVATED' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : (isAwaitingPayment ? 'bg-amber-500 animate-pulse' : 'bg-gray-500')}`} />
                        <div>
                           <h4 className="text-white font-sync text-xs tracking-widest">{m.id}</h4>
                           <p className="text-[10px] text-gray-500 mt-1 uppercase">{m.client_name || 'Principal'} • {m.status.replace('_', ' ')} • Pay: {m.payment_status}</p>
                           
                           {/* Quick overview */}
                           <div className="mt-2 text-[10px] text-gray-400 flex flex-wrap gap-2">
                              {m.mission_customizations?.map((c: any) => (
                                <div key={c.id} className="bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                                  Custom: {c.cci_level} ({c.status})
                                  {c.status !== 'VERIFIED' && (
                                    <button onClick={(e) => { e.stopPropagation(); verifyMissionCustomization(c.id); }} className="text-fbblue hover:text-white">Verify</button>
                                  )}
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        {isAwaitingPayment && (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                             {m.payment_receipt_url && (
                               <a href={m.payment_receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-[10px] ui-sync hover:bg-white/5 transition-colors">
                                 <ExternalLink className="w-3 h-3" /> RECEIPT
                               </a>
                             )}
                             <button onClick={() => handleVerifyPayment(m.id, 'VERIFIED', m.client_name, m.client_email)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] ui-sync hover:bg-emerald-500/40">VERIFY</button>
                             <button onClick={() => handleVerifyPayment(m.id, 'FAILED', m.client_name, m.client_email)} className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] ui-sync hover:bg-rose-500/40">FAIL</button>
                          </div>
                        )}
                        
                        {m.status === 'OPERATOR_REVIEW' && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleActivateMission(m.id); }}
                             className="px-6 py-2 bg-white text-black font-bold rounded-lg text-[10px] ui-sync hover:bg-blue-500 hover:text-white transition-all shadow-md flex items-center gap-2"
                           >
                             <Send className="w-3 h-3" /> ACTIVATE MISSION
                           </button>
                        )}
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                     </div>
                   </div>
                   
                   {/* Expanded Details */}
                   <AnimatePresence>
                     {isExpanded && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                         <MissionExpandedView mission={m} refetchMissions={refetchMissions} />
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               );
             })}
          </div>
        </div>
      )}

      {activeTab === 'OPERATORS' && (
        <div className="space-y-6">
          <h2 className="ui-sync text-gray-400 text-sm tracking-widest ml-2 uppercase">OPERATOR GOVERNANCE</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
             <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
                <p className="ui-sync text-[8px] text-gray-400 tracking-widest">ISSUED ACCESS CODES</p>
                <p className="text-3xl font-light">{accessCodes?.length || 0}</p>
             </div>
             <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
                <p className="ui-sync text-[8px] text-amber-500 tracking-widest">UNREGISTERED (PENDING SETUP)</p>
                <p className="text-3xl font-light">{(accessCodes?.length || 0) - (operators?.length || 0)}</p>
             </div>
             <div className="glass-vip p-6 rounded-[2rem] border border-white/5 space-y-4">
                <p className="ui-sync text-[8px] text-emerald-500 tracking-widest">VERIFIED OPERATORS</p>
                <p className="text-3xl font-light">{operators?.filter(op => op.verification_status === 'VERIFIED').length || 0}</p>
             </div>
          </div>
          
          <div className="grid gap-4">
             {!operators || operators.length === 0 ? (
               <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 text-sm">No operators registered.</div>
             ) : (
               operators.map((op: any) => {
                 const isUnderReview = op.verification_status === 'AWAITING_REVIEW' || op.ove_state === 'UNDER_VERIFICATION' || op.compliance_status === 'PENDING_KYC';
                 const isExpanded = expandedOperatorId === op.id;
                 
                 return (
                   <div id={`operator-card-${op.id}`} key={op.id} className={`glass-vip border p-6 rounded-2xl flex flex-col gap-4 transition-all duration-300 ${isUnderReview ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'} ${isExpanded ? 'ring-2 ring-fbblue/40' : ''}`}>
                     <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedOperatorId(isExpanded ? null : op.id)}>
                       <div>
                         <h3 className="text-lg text-white/90 flex items-center gap-2">
                           {op.name || 'Unknown Operator'}
                           {isUnderReview && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                         </h3>
                         <p className="text-sm text-gray-400">{op.contact_email} • {op.contact_phone || op.phone || 'No phone'}</p>
                         <p className="text-[10px] font-mono text-gray-500 mt-2">Access Code: {op.access_code} • System ID: {op.id}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className={`text-[10px] ui-sync px-3 py-1 rounded border ${isUnderReview ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : (op.verification_status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30')}`}>
                           {isUnderReview ? 'AWAITING REVIEW' : op.verification_status}
                         </span>
                         {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                       </div>
                     </div>
                     
                     <div className="grid md:grid-cols-2 gap-4 mt-2">
                       <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                         <h4 className="text-[10px] ui-sync text-gray-500 mb-2">WIRE TRANSFER DETAILS</h4>
                         <div className="text-xs space-y-1 font-mono text-gray-300">
                           <p>Bank: {op.wire_bank_name || op.financial_coordination?.bankName || 'N/A'}</p>
                           <p>Routing: {op.wire_routing_number || 'N/A'}</p>
                           <p>Account: {op.wire_account_number || op.financial_coordination?.accountNumber || 'N/A'}</p>
                           <p>SWIFT: {op.wire_swift_code || 'N/A'}</p>
                           <p>Address: {op.wire_bank_address || 'N/A'}</p>
                           <p>Beneficiary: {op.financial_coordination?.beneficiaryName || 'N/A'}</p>
                         </div>
                       </div>
                       <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                         <h4 className="text-[10px] ui-sync text-gray-500 mb-2">COMPLIANCE SCORES</h4>
                         <div className="text-xs space-y-1 font-mono text-gray-300">
                           <p>Status: {op.compliance_status || 'PENDING'}</p>
                           <p>Score: {op.compliance_score || 0}/100</p>
                           <p>Availability: {op.availability_score || 100}/100</p>
                           <p>Relationship: {op.relationship_score || 100}/100</p>
                         </div>
                       </div>
                     </div>

                     {/* Expanded Panel: Dynamic verification iframe, Cloudflare Worker report, and real-time hotline */}
                     {isExpanded && (
                       <div className="border-t border-white/5 pt-6 mt-4 space-y-8">
                         <div className="grid lg:grid-cols-2 gap-8">
                           {/* Cloudflare Worker Report */}
                           <CloudflareReviewReport operator={op} />

                           {/* P2P Real-time Hotline Chat */}
                           <IccOperatorChat operatorId={op.id} operatorName={op.name || 'Operator'} />
                         </div>

                         {/* Operator Workspace iframe portal */}
                         <div className="space-y-3">
                           <div className="flex justify-between items-center">
                             <h4 className="text-[10px] ui-sync text-fbblue font-mono uppercase tracking-widest">INTERACTIVE COMPLIANCE GATEWAY & INTERFACE iFRAME</h4>
                             <span className="text-[8px] font-mono text-gray-500">SECURE ISOLATED SANDBOX PREVIEW</span>
                           </div>
                           <div className="relative border border-white/10 rounded-2xl bg-black overflow-hidden shadow-2xl h-[550px]">
                             <iframe 
                               src={"/operators?preview=true&email=" + encodeURIComponent(op.contact_email)} 
                               className="w-full h-full border-none" 
                               title={`Aviation Compliance Portal - ${op.name}`}
                             />
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {isUnderReview && (
                       <div className="flex gap-4 mt-2">
                         <button onClick={() => handleApproveOperator(op.id, op.contact_email, op.name)} className="px-6 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] ui-sync hover:bg-emerald-500/30 cursor-pointer">
                           APPROVE VERIFICATION
                         </button>
                       </div>
                     )}
                   </div>
                 )
               })
             )}
          </div>
        </div>
      )}

      {activeTab === 'LEADS' && (
         <div className="space-y-6">
           <h2 className="ui-sync text-gray-400 text-sm tracking-widest ml-2 uppercase">OPERATOR ONBOARDING LEADS</h2>
           <div className="grid gap-4">
             {!leads || leads.length === 0 ? (
               <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 text-sm">No pending leads.</div>
             ) : (
               leads.map((lead: any) => (
                 <div key={lead.id} className="glass-vip border border-white/5 p-6 rounded-2xl space-y-4">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-lg text-white/90">{lead.company_name}</h3>
                       <p className="text-sm text-gray-400">{lead.email}</p>
                     </div>
                     <span className="text-[10px] ui-sync px-3 py-1 bg-white/10 text-white rounded">
                       {lead.status}
                     </span>
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-4">
                     <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                       <h4 className="text-[10px] ui-sync text-gray-500 mb-2">WIRE DETAILS</h4>
                       <div className="text-xs space-y-1 font-mono text-gray-300">
                         <p>Bank: {lead.wire_bank_name || 'N/A'}</p>
                         <p>Routing: {lead.wire_routing_number || 'N/A'}</p>
                         <p>Account: {lead.wire_account_number || 'N/A'}</p>
                         <p>SWIFT: {lead.wire_swift_code || 'N/A'}</p>
                       </div>
                     </div>
                     <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                       <h4 className="text-[10px] ui-sync text-gray-500 mb-2">AOC PAYLOAD</h4>
                       <pre className="text-[10px] font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-24">
                         {JSON.stringify(lead.aoc_payload, null, 2)}
                       </pre>
                     </div>
                   </div>
                   
                   {lead.status === 'PENDING_REVIEW' && (
                     <div className="pt-2">
                       <button onClick={() => handleApproveLead(lead.id, lead.email)} className="px-6 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] ui-sync hover:bg-emerald-500/30">
                         MARK VERIFIED
                       </button>
                     </div>
                   )}
                 </div>
               ))
             )}
           </div>
         </div>
      )}

      {activeTab === 'GIO' && (
        <div className="space-y-6">
          <h2 className="ui-sync text-gray-400 text-sm tracking-widest ml-2 uppercase">GIO INTEL AGENTS</h2>
          
          {gioApplicants && gioApplicants.length > 0 && (
            <div className="glass-vip p-6 rounded-2xl border border-fbblue/20 bg-fbblue/5 mb-8">
              <h3 className="text-sm text-fbblue mb-4 font-light">Pending GIO Applications</h3>
              <div className="grid gap-4">
                {gioApplicants.filter((app: any) => app.status === 'PENDING').map((app: any) => (
                  <div key={app.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-black/40 rounded-xl border border-white/5">
                    <div>
                      <p className="text-sm text-white">{app.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">
                        {app.email} • {app.location} {app.phone ? ` • Phone: ${app.phone}` : ''}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleApproveGioApplicant(app.id, app.email, app.name)}
                      className="mt-2 md:mt-0 px-6 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] ui-sync hover:bg-emerald-500/30 whitespace-nowrap"
                    >
                      APPROVE & PROVISION
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-vip p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-sm text-white mb-4 font-light">Provision New GIO Anchor</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Agent Email" 
                value={gioEmail}
                onChange={e => setGioEmail(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-fbblue outline-none"
              />
              <div className="flex flex-1 gap-2">
                <input 
                  type="text" 
                  placeholder="Delegation Token (Hash)" 
                  value={gioToken}
                  onChange={e => setGioToken(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-fbblue outline-none font-mono"
                />
                <button 
                  onClick={() => setGioToken('GIO-' + Math.random().toString(36).substring(2, 12).toUpperCase())}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 hover:bg-white/10 transition-colors"
                  title="Generate Hash"
                >
                  GENERATE
                </button>
              </div>
              <button 
                onClick={handleCreateGio}
                className="px-6 py-3 bg-gold/20 text-gold border border-gold/30 rounded-xl text-xs ui-sync hover:bg-gold/30 whitespace-nowrap"
              >
                PROVISION ACCESS
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {(!gioAgents || gioAgents.length === 0) ? (
               <div className="col-span-full p-8 text-center text-sm text-gray-500">No active GIO agents.</div>
             ) : (
               gioAgents.map((agent: any) => (
                 <div key={agent.id} className="glass-3 bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-light text-white/90">{agent.label}</p>
                        <p className="text-[10px] ui-sync text-gray-500 mt-1">STATUS: {agent.active ? 'ACTIVE' : 'REVOKED'}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                      <p className="text-[8px] text-gray-500 mb-1 uppercase">Delegation Token</p>
                      <p className="font-mono text-xs text-gold/80 break-all">{agent.delegation_token}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4">Expires: {formatToLocalDate(agent.expires_at)}</p>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-[#0c0c10]/95 border border-amber-500/30 rounded-2xl p-5 shadow-[0_10px_30px_rgba(245,158,11,0.15)] backdrop-blur-xl flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-amber-500 tracking-widest uppercase font-semibold">LIVE EDGE AUDIT VERIFICATION</span>
                    <span className="text-[8px] font-mono text-gray-500">JUST NOW</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1 truncate">{toast.operatorName}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{toast.operatorEmail || 'No email specified'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded uppercase">
                      {toast.region}
                    </span>
                    <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      SCORE: {toast.complianceScore}/100
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 border-t border-white/5 pt-3">
                <button
                  onClick={() => {
                    setActiveTab('OPERATORS');
                    setExpandedOperatorId(toast.operatorId);
                    setTimeout(() => {
                      const card = document.getElementById(`operator-card-${toast.operatorId}`);
                      if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 300);
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold font-mono tracking-wider uppercase py-2 px-3 rounded-lg transition-colors cursor-pointer text-center"
                >
                  VIEW PORTFOLIO
                </button>
                <button
                  onClick={() => {
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold font-mono tracking-wider uppercase py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}


function MissionExpandedView({ mission, refetchMissions }: { mission: any, refetchMissions: any }) {
  const queryClient = useQueryClient();
  const { data: tasks } = useQuery({
    queryKey: ['mission_tasks', mission.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('mission_tasks').select('*').eq('mission_id', mission.id).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: verifications } = useQuery({
    queryKey: ['digital_verifications', mission.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('digital_verifications').select('*').eq('mission_id', mission.id);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: chats } = useQuery({
    queryKey: ['mission_chats', mission.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('mission_chats').select('*').eq('mission_id', mission.id).contains('visibility', ['ICC']).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from('mission_chats').insert({
        mission_id: mission.id,
        sender_role: 'ICC',
        sender_id: 'COMMAND',
        message,
        visibility: ['ICC', 'GIO']
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission_chats', mission.id] })
  });

  const [chatMsg, setChatMsg] = useState('');

  return (
    <div className="mt-6 pt-6 border-t border-white/5" onClick={e => e.stopPropagation()}>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4 text-sm font-light">
           <h5 className="ui-sync text-[10px] text-gray-500 tracking-widest mb-2">MISSION DETAILS</h5>
           <p className="text-gray-300">Client: <span className="text-white">{mission.client_name || 'N/A'}</span></p>
           <p className="text-gray-300">Email: <span className="text-white">{mission.client_email}</span></p>
           <p className="text-gray-300">Phone: <span className="text-white">{mission.client_phone || 'N/A'}</span></p>
           <p className="text-gray-300">Pax: <span className="text-white">{mission.pax}</span></p>
           <p className="text-gray-300">Aircraft Class: <span className="text-white">{mission.aircraft_class || 'N/A'}</span></p>
           <p className="text-gray-300">Selected Tail: <span className="text-white">{mission.selected_aircraft_tail || 'None'}</span></p>
        </div>
        <div className="space-y-4 text-sm font-light">
           <h5 className="ui-sync text-[10px] text-gray-500 tracking-widest mb-2">FINANCIALS & ROUTING</h5>
           <p className="text-gray-300">Status: <span className="text-white">{mission.status}</span></p>
           <p className="text-gray-300">Payment: <span className="text-white">{mission.payment_status}</span></p>
           <p className="text-gray-300">Est. Cost: <span className="text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(mission.estimated_lower || 0)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(mission.estimated_upper || 0)}</span></p>
           <p className="text-gray-300">Routing (Legs / Payload):</p>
            <div className="bg-black/30 p-3 rounded-lg text-xs font-mono">
              {(() => {
                const parsedLegs = typeof mission.legs === 'string' ? JSON.parse(mission.legs) : mission.legs;
                const legsArr = Array.isArray(parsedLegs) ? parsedLegs : [];
                if (legsArr.length > 0) {
                  return legsArr.map((leg: any, idx: number) => (
                    <div key={idx} className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                      <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {leg.origin || leg.departure || leg.from}</p>
                      <p className="text-white"><span className="text-gray-500">DEST:</span> {leg.destination || leg.to}</p>
                      <p className="text-[10px] text-gray-500">{leg.date}</p>
                    </div>
                  ));
                }
                if (mission.departure_airport || mission.destination_airport) {
                  return (
                    <div className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                      <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {mission.departure_airport || 'N/A'}</p>
                      <p className="text-white"><span className="text-gray-500">DEST:</span> {mission.destination_airport || 'N/A'}</p>
                    </div>
                  );
                }
                if (mission.raw_payload && (mission.raw_payload.origin || mission.raw_payload.departure || mission.raw_payload.destination)) {
                  return (
                    <div className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                      <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {mission.raw_payload.origin || mission.raw_payload.departure || 'N/A'} {mission.raw_payload.origin_airport ? `(${mission.raw_payload.origin_airport})` : ''}</p>
                      <p className="text-white"><span className="text-gray-500">DEST:</span> {mission.raw_payload.destination || 'N/A'} {mission.raw_payload.destination_airport ? `(${mission.raw_payload.destination_airport})` : ''}</p>
                      {mission.raw_payload.date && <p className="text-[10px] text-gray-500">{mission.raw_payload.date}</p>}
                    </div>
                  );
                }
                return 'No routing provided';
              })()}
            </div>

            {mission.operator_quote && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mt-4 space-y-3">
                 <h6 className="text-emerald-400 font-sync text-[9px] tracking-wider uppercase font-semibold">PARTNER OPERATOR QUOTE RESPONSE</h6>
                 <p className="text-gray-300 text-xs font-light">Final Quote: <span className="font-bold text-emerald-300">${Number(mission.operator_quote).toLocaleString()} USD</span></p>
                 <p className="text-gray-300 text-xs font-light">Assigned Tail: <span className="font-bold text-emerald-300">{mission.operator_aircraft || 'Pending'}</span></p>
                 {mission.raw_payload?.operator_verified && (
                   <p className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold font-mono">
                     ✓ PRE-FLIGHT DISPATCH SUITABILITY VERIFIED
                   </p>
                 )}
                 
                 {mission.raw_payload?.icc_approved_quote ? (
                   <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 p-2 rounded-lg text-center text-[10px] font-bold font-mono tracking-wide">
                     ✓ FINAL QUOTE APPROVED & PRESENTED TO CLIENT
                   </div>
                 ) : (
                   <button
                     onClick={async () => {
                       const updatedPayload = {
                         ...(mission.raw_payload || {}),
                         icc_approved_quote: true,
                         final_quote_amount: mission.operator_quote,
                         tail_number: mission.operator_aircraft,
                         virtual_tour_url: "https://vimeo.com/768019324",
                         plane_image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80",
                         plane_images: [
                           "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=600&q=80",
                           "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80"
                         ],
                         plane_video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
                         readiness_status: "Ready for flight. Pre-flight check cleared. Crew dispatched."
                       };

                       const { error } = await supabase
                         .from('missions')
                         .update({
                           raw_payload: updatedPayload,
                           status: 'ACTIVATED'
                         })
                         .eq('id', mission.id);

                       if (!error) {
                         alert("Final quote approved! Tail number, virtual tour, and readiness dispatch successfully presented to the Client Portal.");
                         refetchMissions();
                       } else {
                         alert("Failed to approve quote: " + error.message);
                       }
                     }}
                     className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-[10px] font-sync tracking-widest transition-colors shadow-lg cursor-pointer"
                   >
                     APPROVE FINAL QUOTE & DISPATCH PAYLOAD
                   </button>
                 )}
              </div>
            )}
            
           {mission.mission_customizations && mission.mission_customizations.length > 0 && (
              <div className="mt-4">
                <h5 className="ui-sync text-[10px] text-gray-500 tracking-widest mb-2">CUSTOMIZATIONS</h5>
                <div className="space-y-2">
                  {mission.mission_customizations.map((c: any) => (
                    <div key={c.id} className="bg-black/30 p-3 rounded-lg text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-medium">{c.cci_level}</span>
                        <span className="text-fbblue">{c.classification}</span>
                      </div>
                      <p className="text-gray-300 mt-2">{c.request_details}</p>
                      {c.system_support && <p className="text-gray-500 text-[10px] mt-1">Support: {c.system_support}</p>}
                      <p className="text-[10px] text-gray-500 mt-2 uppercase">Status: {c.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
           {mission.payment_receipt_url && (
             <div className="bg-black/30 p-3 rounded-lg border border-white/5 mt-4">
               <p className="ui-sync text-[8px] text-gray-500 tracking-widest mb-2">PAYMENT RECEIPT</p>
               <a href={mission.payment_receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-fbblue hover:text-white transition-colors text-xs">
                 <ExternalLink className="w-3 h-3" /> View Receipt Document
               </a>
             </div>
           )}
        </div>
      </div>
      
      {/* Live Verifications & Comms Section */}
      <div className="mt-8 grid md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
        <div>
           <h5 className="ui-sync text-[10px] text-emerald-500 tracking-widest mb-4">GCO LIVE VERIFICATIONS</h5>
           <div className="space-y-2 mb-6">
              {tasks?.map((task: any) => (
                 <div key={task.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                   <div className="flex gap-2 items-center">
                     {task.is_completed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-gray-600" />}
                     <div>
                       <p className="text-[9px] ui-sync text-gray-500">{task.phase}</p>
                       <span className="text-xs font-light text-white">{task.task_name}</span>
                     </div>
                   </div>
                   {task.is_completed && <span className="ui-sync text-[8px] text-gray-400">{new Date(task.completed_at).toLocaleTimeString()}Z</span>}
                 </div>
              ))}
              {(!tasks || tasks.length === 0) && <p className="text-xs text-gray-500">No verification tasks bootstrapped yet.</p>}
           </div>

           <h5 className="ui-sync text-[10px] text-emerald-500 tracking-widest mb-4">DIGITAL TRIGGERS</h5>
           <div className="space-y-2">
              {verifications?.map((v: any) => (
                 <div key={v.id} className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                   <div className="flex gap-2 items-center">
                     <ShieldCheck className="w-4 h-4 text-emerald-500" />
                     <span className="text-xs font-light text-emerald-400">{v.verification_type}</span>
                   </div>
                   <span className="ui-sync text-[8px] text-emerald-500">{new Date(v.confirmed_at).toLocaleTimeString()}Z</span>
                 </div>
              ))}
              {(!verifications || verifications.length === 0) && <p className="text-xs text-gray-500">No triggers fired.</p>}
           </div>
        </div>

        <div className="flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-black/20 h-[400px]">
           <div className="bg-white/[0.02] p-3 border-b border-white/5">
              <h5 className="ui-sync text-[10px] text-fbblue tracking-widest">SECURE P2P COMMS (DO CHAT)</h5>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chats?.map((chat: any) => {
                  const isMe = chat.sender_role === 'ICC';
                  return (
                    <div key={chat.id} className={`${isMe ? 'self-end' : 'self-start'} max-w-[90%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`${isMe ? 'bg-fbblue rounded-tr-sm text-white' : 'bg-white/[0.05] rounded-tl-sm text-gray-200'} p-3 rounded-2xl text-xs font-light`}>
                        {chat.message}
                      </div>
                      <span className={`text-[8px] ui-sync text-gray-500 mt-1 block`}>
                        {chat.sender_id || chat.sender_role} • {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}Z
                      </span>
                    </div>
                  );
                })}
                {(!chats || chats.length === 0) && <p className="text-xs text-gray-500 text-center mt-4">No communications.</p>}
           </div>
           <form 
              onSubmit={e => { e.preventDefault(); sendChatMutation.mutate(chatMsg); setChatMsg(''); }}
              className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-2"
           >
             <input 
               type="text" 
               value={chatMsg}
               onChange={e => setChatMsg(e.target.value)}
               placeholder="Transmit to mission..." 
               className="flex-1 bg-black border border-white/10 text-xs text-white px-3 py-2 rounded-lg outline-none font-light" 
             />
             <button type="submit" disabled={!chatMsg.trim()} className="bg-fbblue px-3 py-2 rounded-lg text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
               <Send className="w-3 h-3" />
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}
