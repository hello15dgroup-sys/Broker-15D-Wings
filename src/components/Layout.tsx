import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  return (
    <div className="min-h-screen selection:bg-fbblue selection:text-white">
      <Navbar />
      <main className="relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Global Background Tech Grid */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(24, 119, 242, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 119, 242, 0.05) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
      </div>
    </div>
  );
}
