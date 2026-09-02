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

  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const requestPushNotifications = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setPushStatus('Not supported');
        setTimeout(() => setPushStatus(null), 3000);
        return;
      }
      
      if (Notification.permission === 'granted') {
        setPushStatus('Already Enabled');
        setTimeout(() => setPushStatus(null), 3000);
        return;
      }

      if (Notification.permission === 'denied') {
        setPushStatus('Permission Denied');
        setTimeout(() => setPushStatus(null), 3000);
        return;
      }

      const permission = await Notification.requestPermission().catch(() => 'denied');
      if (permission === 'granted') {
        setPushStatus('Alerts Enabled');
      } else {
        setPushStatus('Alerts Blocked');
      }
      setTimeout(() => setPushStatus(null), 3000);
    } catch (err) {
      console.warn('Desktop notifications request blocked or unsupported in frame:', err);
      setPushStatus('Unavailable in Frame');
      setTimeout(() => setPushStatus(null), 3000);
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
        className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white border border-purple-200 flex items-center justify-center hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer shadow-sm active:scale-95 text-gray-800"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <User className="w-5 h-5 text-gray-800" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className="absolute right-0 mt-3 w-56 bg-white border border-purple-200 rounded-2xl shadow-2xl overflow-hidden py-2 touch-manipulation z-[150]"
          >
            <div className="px-4 py-3 border-b border-purple-100 mb-1 bg-[#fff6f6]" style={{ backgroundColor: '#fff6f6' }}>
               <p className="text-[10px] font-sync font-bold tracking-widest text-purple-700 uppercase">SYSTEM ACCESS</p>
            </div>
            
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors cursor-pointer active:bg-purple-100">
              <Settings className="w-4 h-4 text-purple-600" /> Profile Settings
            </button>
            <button onClick={requestPushNotifications} className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors cursor-pointer active:bg-purple-100">
              <BellRing className="w-4 h-4 text-purple-600" />
              <span>{pushStatus ? pushStatus : 'Enable Push Alerts'}</span>
            </button>
            <a href="https://15dwings.com.ng/faqs" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors cursor-pointer active:bg-purple-100">
              <HelpCircle className="w-4 h-4 text-purple-600" /> Help & FAQs
            </a>
            <a href="mailto:ops@15dwings.com.ng" className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors cursor-pointer active:bg-purple-100">
              <Mail className="w-4 h-4 text-purple-600" /> Contact Operations
            </a>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer border-t border-purple-100 mt-1 active:bg-red-100"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
