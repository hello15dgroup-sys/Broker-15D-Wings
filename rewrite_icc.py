import sys

content = open('src/pages/ICCDashboard.tsx').read()
# Replace the expanded details with a sub-component

# 1. We'll define the sub-component at the top
sub_comp = '''
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
'''

# Wait, `useQueryClient` and `useMutation` are not imported in ICCDashboard.tsx.
# Need to add those imports.
content = content.replace("import { useState } from 'react';", "import { useState } from 'react';\nimport { useQueryClient, useMutation } from '@tanstack/react-query';")

# Find the start and end of the expanded block
start_str = '<div className="mt-6 pt-6 border-t border-white/5 grid md:grid-cols-2 gap-6" onClick={e => e.stopPropagation()}>'
end_str = '                           </div>\n                         </div>\n                       </motion.div>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + "<MissionExpandedView mission={m} refetchMissions={refetchMissions} />\n                       </motion.div>" + content[end_idx:]
    new_content = new_content + "\n" + sub_comp
    open('src/pages/ICCDashboard.tsx', 'w').write(new_content)
    print("Rewritten expanded view")
else:
    print("Could not find expanded view block")
