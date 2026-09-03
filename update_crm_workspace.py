import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

# 1. Add ShieldAlert to imports
content = content.replace("ShieldCheck,", "ShieldCheck,\n  ShieldAlert,")

# 2. Update Proposals Tab button in CRM
old_tab_button = """          <button
            onClick={() => {
              handleUseTrialFeature(() => setActiveSubTab('proposals'));
            }}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-sync uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'proposals'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-gray-700 hover:text-gray-950 hover:bg-purple-50 font-medium'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PROPOSAL BUILDER</span>
          </button>"""

new_tab_button = """          <button
            onClick={() => {
              if (!hasVerifiedOperator && onRequireOperator) {
                onRequireOperator();
              }
              setActiveSubTab('proposals');
            }}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-sync uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'proposals'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-gray-700 hover:text-gray-950 hover:bg-purple-50 font-medium'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PROPOSAL BUILDER</span>
            {!hasVerifiedOperator && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-mono font-bold flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> LOCKED
              </span>
            )}
          </button>"""

content = content.replace(old_tab_button, new_tab_button)

# 3. Update proposals view to STRICTLY hide builder if unverified
old_proposals_view = """      {/* SUB-TAB 3: WHITE-LABEL PROPOSAL BUILDER */}
      {activeSubTab === 'proposals' && (
        <WhiteLabelProposalBuilder
          missionId="15D-7F9E"
          originCode="LOS"
          destCode="EGKB"
          aircraftName="Challenger 650 (5N-ZNT)"
          baselineWholesaleCostUsd={110000}
        />
      )}"""

new_proposals_view = """      {/* SUB-TAB 3: WHITE-LABEL PROPOSAL BUILDER */}
      {activeSubTab === 'proposals' && (
        hasVerifiedOperator ? (
          <WhiteLabelProposalBuilder
            missionId="15D-7F9E"
            originCode="LOS"
            destCode="EGKB"
            aircraftName="Challenger 650 (5N-ZNT)"
            baselineWholesaleCostUsd={110000}
          />
        ) : (
          <div className="max-w-2xl mx-auto my-6 p-8 md:p-12 rounded-[2.5rem] border border-amber-200 bg-white/95 shadow-2xl text-center space-y-6">
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
                onClick={onRequireOperator}
                className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sync uppercase text-xs font-bold tracking-wider shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Complete Operator Verification (AOC)</span>
              </button>
            </div>
          </div>
        )
      )}"""

content = content.replace(old_proposals_view, new_proposals_view)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)

print("Updated BrokerCRMWorkspace.tsx successfully")
