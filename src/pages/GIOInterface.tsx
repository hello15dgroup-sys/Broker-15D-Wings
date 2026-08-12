import { formatToLocalDate } from '../lib/utils';
import { useState, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, PhoneCall, Paperclip, Send, Mic, ShieldCheck, MapPin, Database, Lock, User, FileText, ChevronRight, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import RegulatoryDisclaimer from '../components/RegulatoryDisclaimer';
import UserMenu from '../components/UserMenu';
import { supabase } from '../lib/supabase';

const Spline = lazy(() => import('@splinetool/react-spline'));

type GIOState = 'LOGIN' | 'DASHBOARD';

export default function GIOInterface() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionVerified = searchParams.get('verified') === 'true';
  const [appState, setAppState] = useState<GIOState>(sessionVerified ? 'DASHBOARD' : 'LOGIN');

  const handleLogin = () => {
    setSearchParams({ verified: 'true' });
    setAppState('DASHBOARD');
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-lexend overflow-hidden pt-32 pb-20 px-6 md:px-12">
      <div className="absolute -inset-10 z-0 opacity-40 transform scale-[1.25] md:scale-[1.15] translate-y-8 origin-center pointer-events-none">
         <Suspense fallback={null}>
           <Spline scene="https://prod.spline.design/SoQL7QRyfca0qCWp/scene.splinecode" />
         </Suspense>
      </div>
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {appState === 'LOGIN' && <GIOLogin onLogin={handleLogin} key="login" />}
          {appState === 'DASHBOARD' && <GIODashboard key="dashboard" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useEffect } from 'react';

function GIOLogin({ onLogin }: { onLogin: () => void; key?: string }) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState(searchParams.get('token') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyName, setApplyName] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const [applyLocation, setApplyLocation] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Credentials incomplete.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // Direct query to gio_intel table
      const { data, error: queryError } = await supabase
        .from('gio_intel')
        .select('*')
        .eq('email', email)
        .eq('login_hash', password)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      if (data) {
        if (new Date(data.hash_expires_at).getTime() > Date.now()) {
          setLoading(false);
          onLogin();
        } else {
          setError('Invalid or expired credentials');
          setLoading(false);
        }
      } else {
        // Fallback to RPC in case table name is different or they only created RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('verify_gio_login', {
          input_email: email,
          input_hash: password
        });

        if (rpcData && rpcData.authenticated) {
          setLoading(false);
          onLogin();
        } else {
          setError(rpcData?.message || 'Invalid or expired credentials');
          setLoading(false);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt auto-login once on mount if params exist
    if (searchParams.get('email') && searchParams.get('token') && !error) {
      handleAuth();
    }
  }, []);

  const handleApply = async () => {
    if (!email || !applyName || !applyPhone || !applyLocation) {
      setError('Application fields incomplete.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // First try inserting with phone column
      const { error: insertError } = await supabase.from('gio_applicants').insert({
        email,
        name: applyName,
        phone: applyPhone,
        location: applyLocation,
        status: 'PENDING'
      });
      
      if (insertError) {
        // If it's a column error, fallback to storing it in the location field to ensure success
        if (insertError.message?.includes('column') || insertError.code === '42703') {
          const { error: fallbackError } = await supabase.from('gio_applicants').insert({
            email,
            name: applyName,
            location: `${applyLocation} | Phone: ${applyPhone}`,
            status: 'PENDING'
          });
          
          if (fallbackError) {
            setError('Failed to submit application: ' + fallbackError.message);
            setLoading(false);
            return;
          }
        } else {
          setError('Failed to submit application: ' + insertError.message);
          setLoading(false);
          return;
        }
      }
      
      setLoading(false);
      alert('Application submitted successfully. Awaiting ICC approval.');
      setIsApplying(false);
    } catch (e: any) {
      setError('An unexpected error occurred: ' + (e.message || e));
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto flex flex-col items-center mt-10">
      <div className="w-full space-y-10">
        <div className="text-center space-y-4">
          <span className="ui-sync text-fbblue text-[10px] tracking-widest block">GROUND INTELLIGENCE</span>
          <h1 className="font-lexend font-light text-2xl text-white tracking-widest">GIO TARMAC PORTAL</h1>
          <p className="text-gray-400 text-xs font-light leading-relaxed">
            Physical truth layer authentication. Access restricted to actively assigned missions.
          </p>
        </div>

        <div className="glass-3 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-6 shadow-2xl">
          {error && <div className="text-red-500 text-xs text-center border border-red-500/30 p-2 rounded bg-red-500/10 ui-sync">{error}</div>}
          
          {isApplying ? (
            <div className="space-y-4">
              <div>
                <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">FULL NAME</label>
                <input 
                  type="text" 
                  value={applyName}
                  onChange={e => setApplyName(e.target.value)}
                  placeholder="e.g. John Doe" 
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors" 
                />
              </div>
              <div>
                <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">PHONE NUMBER</label>
                <input 
                  type="text" 
                  value={applyPhone}
                  onChange={e => setApplyPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567" 
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors" 
                />
              </div>
              <div>
                <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gio@15dwings.com" 
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors" 
                />
              </div>
              <div>
                <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">PRIMARY AIRPORT/LOCATION</label>
                <input 
                  type="text" 
                  value={applyLocation}
                  onChange={e => setApplyLocation(e.target.value)}
                  placeholder="e.g. DNMM, Lagos" 
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors" 
                />
              </div>
              <button onClick={handleApply} disabled={loading} className="w-full bg-emerald-500 text-black py-4 rounded-xl text-xs hover:bg-emerald-400 transition-colors font-lexend tracking-widest font-bold shadow-lg mt-2">
                {loading ? <span className="animate-spin">...</span> : 'SUBMIT APPLICATION'}
              </button>
              <button onClick={() => setIsApplying(false)} className="w-full text-xs text-gray-500 hover:text-white pt-2 ui-sync">
                BACK TO LOGIN
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">GIO IDENTITY (EMAIL)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gio@15dwings.com" 
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors focus:bg-white/[0.02]" 
                />
              </div>
              <div>
                <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2">GIO ACCESS HASH</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAuth();
                  }}
                  placeholder="••••••••" 
                  className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-fbblue/50 transition-colors focus:bg-white/[0.02]" 
                />
              </div>
              
              <button onClick={handleAuth} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl text-xs hover:bg-gray-200 transition-colors font-lexend tracking-widest font-bold shadow-lg mt-2">
                {loading ? <span className="animate-spin">...</span> : 'AUTHENTICATE PROTOCOL'}
              </button>
              
              <button onClick={() => setIsApplying(true)} className="w-full text-xs text-fbblue hover:text-fbblue/80 pt-2 ui-sync">
                APPLY FOR GIO CLEARANCE
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 justify-center pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] text-gray-500 ui-sync tracking-widest">End-to-End Encrypted</span>
          </div>
        </div>
      </div>
      <RegulatoryDisclaimer />
    </motion.div>
  );
}

function GIODashboard() {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'VAULT' | 'HISTORY' | 'SETTINGS'>('COMMAND');
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const queryClient = useQueryClient();

  // Fetch agent details
  const { data: agent } = useQuery({
    queryKey: ['gio_agent', email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase.from('gio_intel').select('*').eq('email', email).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!email
  });

  // Fetch active missions
  const { data: missions } = useQuery({
    queryKey: ['gio_missions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('missions').select('*').in('status', ['ACTIVATED', 'PRE_ACTIVATION']).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const activeMission = missions?.find(m => m.id === selectedMissionId) || missions?.[0];

  // Fetch Tasks for active mission
  const { data: tasks } = useQuery({
    queryKey: ['mission_tasks', activeMission?.id],
    queryFn: async () => {
      if (!activeMission?.id) return [];
      const { data, error } = await supabase.from('mission_tasks').select('*').eq('mission_id', activeMission.id).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeMission?.id
  });

  // Fetch Digital Verifications
  const { data: verifications } = useQuery({
    queryKey: ['digital_verifications', activeMission?.id],
    queryFn: async () => {
      if (!activeMission?.id) return [];
      const { data, error } = await supabase.from('digital_verifications').select('*').eq('mission_id', activeMission.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeMission?.id
  });

  // Fetch Chats
  const { data: chats } = useQuery({
    queryKey: ['mission_chats', activeMission?.id],
    queryFn: async () => {
      if (!activeMission?.id) return [];
      const { data, error } = await supabase.from('mission_chats').select('*').eq('mission_id', activeMission.id).contains('visibility', ['GIO']).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeMission?.id
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const { error } = await supabase.from('mission_tasks').update({
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : null,
        completed_by: agent?.name || 'GIO'
      }).eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission_tasks', activeMission?.id] })
  });

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!activeMission?.id || !message.trim()) return;
      const { error } = await supabase.from('mission_chats').insert({
        mission_id: activeMission.id,
        sender_role: 'GIO',
        sender_id: agent?.name || 'GIO Agent',
        message,
        visibility: ['ICC', 'GIO']
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission_chats', activeMission?.id] })
  });

  const verifyMutation = useMutation({
    mutationFn: async (type: string) => {
      const { error } = await supabase.from('digital_verifications').insert({
        mission_id: activeMission.id,
        verification_type: type,
        status: 'VERIFIED',
        confirmed_by: agent?.name || 'GIO'
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['digital_verifications', activeMission?.id] })
  });

  // Add default tasks if missing
  const initTasksMutation = useMutation({
    mutationFn: async () => {
      if (!activeMission?.id) return;
      const defaultTasks = [
        { mission_id: activeMission.id, phase: 'Phase I', task_name: 'Confirm Aircraft Placement' },
        { mission_id: activeMission.id, phase: 'Phase I', task_name: 'Verify Crew Duty Limits' },
        { mission_id: activeMission.id, phase: 'Phase II', task_name: 'Fuel Uplift Confirmation' },
        { mission_id: activeMission.id, phase: 'Phase II', task_name: 'Catering Boarded' },
        { mission_id: activeMission.id, phase: 'Phase III', task_name: 'Pax Manifest Match' }
      ];
      for (const t of defaultTasks) {
         await supabase.from('mission_tasks').insert(t).select().maybeSingle();
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission_tasks', activeMission?.id] })
  });

  const [chatMsg, setChatMsg] = useState('');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <span className="ui-sync text-fbblue mb-2 block tracking-widest text-[10px]">GROUND INTELLIGENCE OFFICER</span>
          <h1 className="font-lexend font-light text-3xl md:text-5xl tracking-tight text-white/90">{agent?.name ? agent.name.toUpperCase() : 'AGENT'}</h1>
          <div className="flex flex-wrap gap-4 mt-6 items-center">
            <div className="glass-3 bg-white/[0.02] px-4 py-2 rounded-lg flex items-center gap-2 border border-white/5">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span className="ui-sync text-[8px] text-emerald-500 tracking-widest">ACTIVE DUTY</span>
            </div>
            {missions && missions.length > 0 && (
              <select 
                className="glass-3 bg-black px-4 py-2 rounded-lg ui-sync text-[8px] text-fbblue tracking-widest border border-white/5 outline-none"
                value={activeMission?.id || ''}
                onChange={(e) => setSelectedMissionId(e.target.value)}
              >
                {missions.map(m => (
                  <option key={m.id} value={m.id}>MISSION {m.id.split('-').pop()}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('COMMAND')} className={`px-5 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'COMMAND' ? 'bg-fbblue text-white' : 'glass-3 bg-white/[0.02] text-gray-400 hover:text-white'}`}>
              ICC LINK
            </button>
            <button onClick={() => setActiveTab('VAULT')} className={`px-5 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'VAULT' ? 'bg-fbblue text-white' : 'glass-3 bg-white/[0.02] text-gray-400 hover:text-white'}`}>
              VAULT
            </button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-5 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'HISTORY' ? 'bg-fbblue text-white' : 'glass-3 bg-white/[0.02] text-gray-400 hover:text-white'}`}>
              HISTORY
            </button>
            <button onClick={() => setActiveTab('SETTINGS')} className={`px-5 py-3 rounded-lg text-[10px] ui-sync tracking-widest transition-colors ${activeTab === 'SETTINGS' ? 'bg-fbblue text-white' : 'glass-3 bg-white/[0.02] text-gray-400 hover:text-white'}`}>
              SETTINGS
            </button>
          </div>
          <UserMenu />
        </div>
      </header>

      {activeTab === 'COMMAND' && (
        <div className="grid lg:grid-cols-3 gap-8 h-auto lg:h-[600px]">
          {/* Mission Details Panel */}
          <div className="glass-3 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-y-auto max-h-[600px] scrollbar-hide">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="ui-sync text-[10px] text-gray-500 tracking-widest block">GCO BOOTSTRAP TASKS</span>
                {(!tasks || tasks.length === 0) && (
                  <button onClick={() => initTasksMutation.mutate()} className="text-[9px] ui-sync text-fbblue border border-fbblue/30 px-2 py-1 rounded">INIT TASKS</button>
                )}
              </div>
              
              <div className="space-y-4">
                {tasks?.map((task: any) => (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTaskMutation.mutate(task)}
                    className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl cursor-pointer hover:border-fbblue/30 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[9px] ui-sync text-gray-500 mb-1">{task.phase}</p>
                      <span className="text-sm font-light text-white">{task.task_name}</span>
                    </div>
                    {task.is_completed ? (
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                       <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse mr-1" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                 <span className="ui-sync text-[10px] text-gray-500 tracking-widest block mb-4">DIGITAL VERIFICATIONS</span>
                 <div className="space-y-3">
                    {['Vehicle Alignment', 'Climate Control Status', 'Manifest Handover'].map(v => {
                       const isVerified = verifications?.some((ver: any) => ver.verification_type === v);
                       return (
                         <div key={v} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                           <span className="text-xs font-light text-gray-300">{v}</span>
                           {isVerified ? (
                              <span className="ui-sync text-[9px] text-emerald-500">CONFIRMED</span>
                           ) : (
                              <button onClick={() => verifyMutation.mutate(v)} className="ui-sync text-[9px] text-white/50 border border-white/10 px-2 py-1 rounded hover:bg-white/5">VERIFY</button>
                           )}
                         </div>
                       )
                    })}
                 </div>
              </div>
            </div>
          </div>

          {/* Secure Chat with ICC */}
          <div className="lg:col-span-2 glass-3 bg-white/[0.01] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden min-h-[500px]">
             {/* Chat Header */}
             <div className="bg-white/[0.03] border-b border-white/5 p-6 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-fbblue/20 flex items-center justify-center">
                   <ShieldCheck className="w-5 h-5 text-fbblue" />
                 </div>
                 <div>
                   <h3 className="text-sm font-medium text-white">STRATEGIC COMMAND (P2P DO CHAT)</h3>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="flex w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                     <span className="ui-sync text-[8px] text-gray-400 tracking-widest">SECURE LINK ESTABLISHED</span>
                   </div>
                 </div>
               </div>
             </div>

             {/* Chat History */}
             <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col">
                {chats?.map((chat: any) => {
                  const isMe = chat.sender_role === 'GIO';
                  return (
                    <div key={chat.id} className={`${isMe ? 'self-end' : 'self-start'} max-w-[80%]`}>
                      <div className={`${isMe ? 'bg-fbblue rounded-tr-sm text-white' : 'bg-white/[0.05] rounded-tl-sm text-gray-200'} p-4 rounded-2xl text-sm font-light`}>
                        {chat.message}
                      </div>
                      <span className={`text-[9px] ui-sync text-gray-500 mt-1 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                        {chat.sender_id || chat.sender_role} • {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}Z
                      </span>
                    </div>
                  );
                })}
             </div>

             {/* Input Area */}
             <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendChatMutation.mutate(chatMsg); setChatMsg(''); }}
                  className="bg-black border border-white/10 rounded-2xl flex items-center p-2 pr-4"
                >
                  <button type="button" className="p-3 text-gray-400 hover:text-white transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                    placeholder="Transmit intel to ICC..." 
                    className="flex-1 bg-transparent border-none text-sm text-white px-2 outline-none font-light" 
                  />
                  <button type="button" className="p-3 text-gray-400 hover:text-white transition-colors flex md:hidden">
                    <Camera className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={!chatMsg.trim()} className="ml-2 bg-fbblue p-3 rounded-xl text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'VAULT' && (
        <div className="glass-3 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 min-h-[500px]">
           <div className="flex items-center gap-4 mb-8">
             <Database className="w-6 h-6 text-fbblue" />
             <h2 className="ui-sync text-sm tracking-widest">SECURE EVIDENCE VAULT</h2>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'FUEL_RELEASE_DNMM.pdf', time: '13:45Z', size: '1.2 MB' },
                { name: 'CREW_IDS_SCANNED.jpg', time: '12:10Z', size: '4.5 MB' },
                { name: 'AOC_VERIFICATION.pdf', time: '11:00Z', size: '800 KB' }
              ].map((doc) => (
                <div key={doc.name} className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl flex flex-col justify-between group hover:border-fbblue/30 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
                    <FileText className="w-8 h-8 text-white/50 group-hover:text-fbblue transition-colors" />
                    <Lock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-light mb-1 truncate">{doc.name}</h3>
                    <div className="flex justify-between text-[10px] text-gray-500 ui-sync">
                      <span>{doc.time}</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="glass-3 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 min-h-[500px]">
           <h2 className="ui-sync text-sm tracking-widest mb-8">MISSION LOGS</h2>
           <div className="space-y-4">
             {missions?.map((mission: any) => (
                <div key={mission.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                  <div className="flex items-center gap-6">
                     <span className="ui-sync text-fbblue text-[10px]">{mission.id}</span>
                     <span className="text-sm text-white/80">{mission.departure_airport} → {mission.destination_airport}</span>
                     <span className="text-xs text-gray-500 font-light">{new Date(mission.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                     <span className="ui-sync text-[10px] text-emerald-500">{mission.status}</span>
                     <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="glass-3 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 min-h-[500px] max-w-2xl">
           <h2 className="ui-sync text-sm tracking-widest mb-8">GIO PREFERENCES</h2>
           
           <div className="space-y-8">
             <div className="flex items-center justify-between border-b border-white/5 pb-6">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                   <User className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h3 className="text-lg">{agent?.name || 'Agent'}</h3>
                   <span className="text-[10px] ui-sync text-gray-500">Tier 1 clearance</span>
                 </div>
               </div>
               <button className="text-xs bg-white/[0.05] border border-white/10 px-4 py-2 rounded-lg">Update Profile</button>
             </div>
             <div className="space-y-4">
               <h4 className="text-xs text-gray-400 font-lexend tracking-widest mb-4">SECURITY</h4>
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                 <span className="text-sm font-light">Biometric App Lock</span>
                 <div className="w-10 h-6 bg-fbblue rounded-full relative">
                   <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                 </div>
               </div>
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                 <span className="text-sm font-light">Location Sync to ICC</span>
                 <div className="w-10 h-6 bg-fbblue rounded-full relative">
                   <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                 </div>
               </div>
             </div>
             <button className="w-full py-4 text-xs font-lexend tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl mt-8">
               TERMINATE SESSION
             </button>
           </div>
        </div>
      )}
    </motion.div>
  );
}