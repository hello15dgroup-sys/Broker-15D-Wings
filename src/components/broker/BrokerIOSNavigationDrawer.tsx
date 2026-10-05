import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  FileText,
  CreditCard,
  Radar,
  Database,
  Plane,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckSquare,
  Kanban,
  TrendingUp,
  Briefcase,
  Lock,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Compass,
  ArrowUpRight,
  Code,
  Mail
} from 'lucide-react';

export type BrokerTabType = 
  | 'crm_workspace' 
  | 'proposal_builder' 
  | 'checkout_engine' 
  | 'operational_radar' 
  | 'customization' 
  | 'manifest';

export type CrmSubTabType = 
  | 'tasks' 
  | 'pipeline' 
  | 'clients' 
  | 'proposals' 
  | 'history' 
  | 'analytics' 
  | 'directory' 
  | 'team'
  | 'email_studio';

interface BrokerIOSNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: BrokerTabType;
  onSelectTab: (tab: BrokerTabType) => void;
  activeCrmSubTab?: CrmSubTabType;
  onSelectCrmSubTab?: (subTab: CrmSubTabType) => void;
  hasVerifiedOperator: boolean;
  brokerCompanyName?: string;
  brokerEmail?: string;
  pendingTasksCount?: number;
  activeDealsCount?: number;
  onOpenBookFlight: () => void;
  onOpenOperatorVerification: () => void;
  onOpenReschedule?: () => void;
  onOpenExperiences?: () => void;
  onSignOut: () => void;
}

export const BrokerIOSNavigationDrawer: React.FC<BrokerIOSNavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  activeCrmSubTab,
  onSelectCrmSubTab,
  hasVerifiedOperator,
  brokerCompanyName = '15D Executive Aviation Brokerage',
  brokerEmail,
  pendingTasksCount = 2,
  activeDealsCount = 3,
  onOpenBookFlight,
  onOpenOperatorVerification,
  onOpenReschedule,
  onOpenExperiences,
  onSignOut
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTabClick = (tab: BrokerTabType) => {
    onSelectTab(tab);
    onClose();
  };

  const handleCrmSubTabClick = (subTab: CrmSubTabType) => {
    onSelectTab('crm_workspace');
    if (onSelectCrmSubTab) {
      onSelectCrmSubTab(subTab);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex pt-[72px] pointer-events-none">
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 top-[72px] bg-slate-950/60 backdrop-blur-sm cursor-pointer pointer-events-auto"
          />

          {/* Clean Executive Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-sm sm:max-w-md bg-white h-[calc(100vh-72px)] shadow-2xl flex flex-col z-20 overflow-hidden border-r border-slate-200 select-none text-slate-900 pointer-events-auto"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 leading-tight">
                    Feature Directory
                  </h2>
                  <p className="text-xs text-slate-500 font-normal">
                    15D Wings Broker Suite
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close menu"
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              
              {/* Primary Action Card: Direct Booking */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-950 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-purple-950">
                    Flight Booking Desk
                  </h3>
                  <p className="text-xs text-purple-700">
                    Launch direct charter request portal
                  </p>
                </div>
                <button
                  onClick={() => {
                    onOpenBookFlight();
                    onClose();
                  }}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  <span>Book Flight</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Operator Verification Status */}
              <div className={`p-4 rounded-2xl border transition-all ${
                hasVerifiedOperator
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {hasVerifiedOperator ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-semibold">
                        {hasVerifiedOperator ? 'Operator Clearance Active' : 'Operator Verification Required'}
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        {hasVerifiedOperator
                          ? 'AOC carrier linked & verified'
                          : 'Verify to unlock white-label proposals'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenOperatorVerification();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    {hasVerifiedOperator ? 'View AOC' : 'Verify'}
                  </button>
                </div>
              </div>

              {/* Section 1: Main Desks */}
              <div className="space-y-2.5">
                <h3 className="px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Main Desks
                </h3>

                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-200/60">
                  <button
                    onClick={() => handleTabClick('crm_workspace')}
                    className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      activeTab === 'crm_workspace' ? 'bg-purple-50/80 text-purple-900 font-medium' : 'hover:bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="text-xs font-medium">CRM & Sales Desk</span>
                        <p className="text-[11px] text-slate-500">Pipeline, clients, deals, and tasks</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleTabClick('proposal_builder')}
                    className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      activeTab === 'proposal_builder' ? 'bg-purple-50/80 text-purple-900 font-medium' : 'hover:bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">Proposal Designer</span>
                          {!hasVerifiedOperator && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-medium flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">Custom branded PDF quotes</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleTabClick('checkout_engine')}
                    className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      activeTab === 'checkout_engine' ? 'bg-purple-50/80 text-purple-900 font-medium' : 'hover:bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-medium">Escrow & Settlements</span>
                        <p className="text-[11px] text-slate-500">Protected payments & funds release</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleTabClick('operational_radar')}
                    className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      activeTab === 'operational_radar' ? 'bg-purple-50/80 text-purple-900 font-medium' : 'hover:bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radar className="w-4 h-4 text-sky-600" />
                      <div>
                        <span className="text-xs font-medium">Live Fleet & Empty Legs</span>
                        <p className="text-[11px] text-slate-500">Active flights, fleet network & deals</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Section 2: Quick CRM Tools */}
              <div className="space-y-2.5">
                <h3 className="px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCrmSubTabClick('tasks')}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-medium">
                        {pendingTasksCount}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">Tasks</span>
                  </button>

                  <button
                    onClick={() => handleCrmSubTabClick('pipeline')}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Kanban className="w-4 h-4 text-purple-600" />
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-900 font-medium">
                        {activeDealsCount}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">Sales Pipeline</span>
                  </button>

                  <button
                    onClick={() => handleCrmSubTabClick('clients')}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/50 text-left transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-purple-600 mb-1.5" />
                    <span className="text-xs font-medium text-slate-900">HNWI Clients</span>
                  </button>

                  <button
                    onClick={() => handleCrmSubTabClick('team')}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/50 text-left transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-purple-600 mb-1.5" />
                    <span className="text-xs font-medium text-slate-900">Broker Team</span>
                  </button>

                  <button
                    onClick={() => handleCrmSubTabClick('email_studio')}
                    className="p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-purple-600 mb-1.5" />
                    <span className="text-xs font-medium text-purple-950">Premium Mail Studio</span>
                  </button>

                </div>
              </div>

            </div>

            {/* Footer Profile & Sign Out */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 shrink-0 flex items-center justify-between">
              <div className="space-y-0.5 max-w-[200px]">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {brokerCompanyName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {brokerEmail || 'Authenticated Broker'}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 hover:border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
