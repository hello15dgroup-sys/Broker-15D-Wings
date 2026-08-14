import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Send, MessageSquare, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  text: string;
  createdAt: any;
  sender: 'client' | 'agent';
}

export const FirebaseChat = ({ missionId }: { missionId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // We remove signInAnonymously as it might be restricted in the console.
    // Instead, we listen for auth state changes or simply proceed with unauthenticated access if rules allow.
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!missionId) return;

    // We allow fetching messages even if not authenticated if the rules are configured for missionId access
    const q = query(collection(db, 'missions', missionId, 'chat'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setTimeout(() => {
         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [user, missionId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      // Ensure the conversation document exists for rules
      await setDoc(doc(db, 'missions', missionId), { initializedAt: serverTimestamp() }, { merge: true });

      await addDoc(collection(db, 'missions', missionId, 'chat'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        sender: 'client'
      });
      setNewMessage('');
    } catch (err) {
      console.error("Firestore Error:", err);
      // We don't throw here to avoid crashing the UI, but we log the context
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#0f172a]/90 backdrop-blur-[10px] border border-white/10 shadow-2xl rounded-2xl w-[350px] h-[500px] flex flex-col mb-4 overflow-hidden"
          >
            <div className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-white font-sync tracking-widest text-xs uppercase">Concierge Chat</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-xs text-white/40 mt-10">Start a secure conversation about Mission {missionId}.</div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === 'client' ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30 rounded-br-sm' : 'bg-white/10 text-white border border-white/5 rounded-bl-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/20">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/50"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isOpen || isMinimized ? (
         <motion.button 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 bg-gradient-to-tr from-[#38bdf8] to-blue-600 rounded-full shadow-lg shadow-[#38bdf8]/20 flex items-center justify-center text-white hover:scale-110 transition-transform"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
         >
           <MessageSquare className="w-6 h-6" />
         </motion.button>
      ) : null}
    </div>
  );
};
