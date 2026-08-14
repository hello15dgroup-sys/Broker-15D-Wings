import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Send, ShieldCheck } from 'lucide-react';

interface MissionChatProps {
  missionId: string;
  role: 'CLIENT' | 'OPERATOR' | 'GIO' | 'ICC';
  senderId: string;
}

export default function MissionChat({ missionId, role, senderId }: MissionChatProps) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');

  const { data: chats } = useQuery({
    queryKey: ['mission_chats', missionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mission_chats')
        .select('*')
        .eq('mission_id', missionId)
        .contains('visibility', [role])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      // Determine visibility based on sender role
      let visibility = ['ICC', 'GIO', 'CLIENT', 'OPERATOR']; // default broad
      if (role === 'GIO') visibility = ['ICC', 'GIO'];
      
      const { error } = await supabase.from('mission_chats').insert({
        mission_id: missionId,
        sender_role: role,
        sender_id: senderId,
        message,
        visibility
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission_chats', missionId] })
  });

  return (
    <div className="flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-black/20 h-[400px]">
      <div className="bg-white/[0.02] p-3 border-b border-white/5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-fbblue" />
        <h5 className="font-lexend text-[10px] text-fbblue tracking-widest">SECURE P2P COMMS (DO CHAT)</h5>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chats?.map((chat: any) => {
          const isMe = chat.sender_role === role;
          return (
            <div key={chat.id} className={`${isMe ? 'self-end' : 'self-start'} max-w-[90%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`${isMe ? 'bg-fbblue rounded-tr-sm text-white' : 'bg-white/[0.05] rounded-tl-sm text-gray-200'} p-3 rounded-2xl text-xs font-light`}>
                {chat.message}
              </div>
              <span className={`text-[8px] font-lexend text-gray-500 mt-1 block`}>
                {chat.sender_id || chat.sender_role} • {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}Z
              </span>
            </div>
          );
        })}
        {(!chats || chats.length === 0) && <p className="text-xs text-gray-500 text-center mt-4">No communications.</p>}
      </div>
      <form 
        onSubmit={e => { e.preventDefault(); sendMutation.mutate(msg); setMsg(''); }}
        className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-2"
      >
        <input 
          type="text" 
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Transmit message..." 
          className="flex-1 bg-black border border-white/10 text-xs text-white px-3 py-2 rounded-lg outline-none font-light" 
        />
        <button type="submit" disabled={!msg.trim()} className="bg-fbblue px-3 py-2 rounded-lg text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
