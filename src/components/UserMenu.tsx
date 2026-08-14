import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, BellRing, HelpCircle, Mail } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    // 1. Clear operator session from localStorage
    localStorage.removeItem('operator_session');
    
    // 2. Clear all client portal emails from sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('15d_email_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}

    // 3. Wreak standard auth sign out
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out:", e);
    }

    // 4. Delete parameters from URL search query
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('verified');
    newParams.delete('missionId');
    setSearchParams(newParams);
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const requestPushNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Push notifications enabled successfully.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-[100] inline-block" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <User className="w-5 h-5 text-white/80" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className="absolute right-0 mt-3 w-56 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 touch-manipulation"
          >
            <div className="px-4 py-3 border-b border-white/5 mb-1">
               <p className="text-[10px] font-lexend tracking-widest text-fbblue">SYSTEM ACCESS</p>
            </div>
            
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-light text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer active:bg-white/10">
              <Settings className="w-4 h-4" /> Profile Settings
            </button>
            <button onClick={requestPushNotifications} className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-light text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer active:bg-white/10">
              <BellRing className="w-4 h-4" /> Enable Push Alerts
            </button>
            <a href="https://15dwings.com.ng/faqs" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-light text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer active:bg-white/10">
              <HelpCircle className="w-4 h-4" /> Help & FAQs
            </a>
            <a href="mailto:ops@15dwings.com.ng" className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-light text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer active:bg-white/10">
              <Mail className="w-4 h-4" /> Contact Operations
            </a>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-light text-red-400 hover:bg-white/[0.05] hover:text-red-300 transition-colors cursor-pointer border-t border-white/5 mt-1 active:bg-white/10"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
