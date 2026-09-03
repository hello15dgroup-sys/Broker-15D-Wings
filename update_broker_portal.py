import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

# 1. Add ShieldAlert to imports
content = content.replace("ShieldCheck,", "ShieldCheck,\n  ShieldAlert,")

# 2. Update checkOperator function
old_check_operator = """  useEffect(() => {
    async function checkOperator() {
      if (!sessionVerified) return;
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;
        
        const { data: broker } = await supabase.from('brokers').select('id').eq('auth_user_id', user.user.id).single();
        if (!broker) return;

        const { data: operators } = await supabase.from('operators').select('id').eq('onboarded_by_broker_id', broker.id);
        if (operators && operators.length > 0) {
          setHasVerifiedOperator(true);
        }
      } catch (e) {
        console.error('Error checking operator:', e);
      }
    }
    checkOperator();
  }, [sessionVerified]);"""

new_check_operator = """  useEffect(() => {
    async function checkOperator() {
      if (!sessionVerified) {
        setHasVerifiedOperator(false);
        return;
      }
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          setHasVerifiedOperator(false);
          return;
        }
        
        const { data: broker } = await supabase
          .from('brokers')
          .select('id, is_verified')
          .eq('auth_user_id', user.user.id)
          .maybeSingle();
        
        if (broker?.is_verified) {
          setHasVerifiedOperator(true);
          return;
        }

        if (broker?.id) {
          const { data: operators } = await supabase
            .from('operators')
            .select('id, is_verified')
            .eq('onboarded_by_broker_id', broker.id);
          
          if (operators && operators.length > 0 && operators.some(o => o.is_verified)) {
            setHasVerifiedOperator(true);
            return;
          }
        }
        
        setHasVerifiedOperator(false);
      } catch (e) {
        console.error('Error checking operator verification status:', e);
        setHasVerifiedOperator(false);
      }
    }
    checkOperator();
  }, [sessionVerified]);"""

content = content.replace(old_check_operator, new_check_operator)

# 3. Update Proposal Builder Tab button in Broker Navigation
old_tab_button = """            <button
              onClick={() => setActiveTab('proposal_builder')}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-sync tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'proposal_builder'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_4px_14px_rgba(147,51,234,0.35)]'
                  : 'bg-white text-gray-800 border-gray-200 hover:text-purple-700 hover:bg-purple-50 shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4" /> proposal builder
            </button>"""

new_tab_button = """            <button
              onClick={() => {
                if (!hasVerifiedOperator) {
                  showToast("Access Restricted: Operator verification required from backend to use Proposal Designer.", "warning");
                }
                setActiveTab('proposal_builder');
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-sync tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'proposal_builder'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_4px_14px_rgba(147,51,234,0.35)]'
                  : 'bg-white text-gray-800 border-gray-200 hover:text-purple-700 hover:bg-purple-50 shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>proposal builder</span>
              {!hasVerifiedOperator && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              )}
            </button>"""

content = content.replace(old_tab_button, new_tab_button)

# 4. Update Proposal Builder rendering to STRICTLY block unverified accounts
old_proposal_render = """          {activeTab === 'proposal_builder' && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
              <WhiteLabelProposalBuilder
                missionId={mission.id}
                originCode={dep.substring(0, 3)}
                destCode={dest.substring(0, 3)}
                aircraftName={mission.operator_aircraft || mission.aircraft_class || "Midsize Jet (Hawker 900XP)"}
                baselineWholesaleCostUsd={totalVerifiedCost || 16250}
              />
            </motion.div>
          )}"""

new_proposal_render = """          {activeTab === 'proposal_builder' && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
              {hasVerifiedOperator ? (
                <WhiteLabelProposalBuilder
                  missionId={mission.id}
                  originCode={dep.substring(0, 3)}
                  destCode={dest.substring(0, 3)}
                  aircraftName={mission.operator_aircraft || mission.aircraft_class || "Midsize Jet (Hawker 900XP)"}
                  baselineWholesaleCostUsd={totalVerifiedCost || 16250}
                />
              ) : (
                <div className="max-w-2xl mx-auto my-8 p-8 md:p-12 rounded-[2.5rem] border border-amber-200 bg-white/95 shadow-2xl text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sync font-bold tracking-widest uppercase inline-flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-700" /> Charlatan Protection Protocol • Backend Clearance Required
                    </span>
                    <h3 className="font-space font-bold text-xl md:text-2xl text-gray-900 uppercase tracking-tight">
                      Proposal Designer Access Denied
                    </h3>
                    <p className="font-lexend text-xs md:text-sm text-gray-700 leading-relaxed max-w-lg mx-auto">
                      Access to the White-Label Proposal Designer Tool is strictly prohibited for unverified accounts. 15D Wings enforces an automated zero-tolerance barrier to prevent unauthorized intermediaries and unverified brokers from distributing uncertified pricing manifests in our ecosystem.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setShowAOCModal(true)}
                      className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sync uppercase text-xs font-bold tracking-wider shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Complete Operator Verification (AOC)</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}"""

content = content.replace(old_proposal_render, new_proposal_render)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)

print("Updated BrokerPortal.tsx successfully")
