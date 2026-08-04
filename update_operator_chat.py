import sys

content = open('src/pages/OperatorDashboard.tsx').read()

target = '''                    <div className="bg-white/5 px-6 py-4 rounded-2xl flex items-center justify-between border border-white/10">
                       <div className="flex items-center gap-4">
                          <ShieldCheck className="w-5 h-5 text-fbblue" />
                          <p className="text-[9px] text-gray-400 font-light leading-relaxed uppercase tracking-widest">
                             Sovereign Identity Verification Enabled. Uploading files does not halt system-pivot countdowns. Only binary <strong className="text-white">VERIFIED</strong> status secures the mission allocation.
                          </p>
                       </div>
                    </div>'''

insert_str = '''
                    <div className="mt-8">
                       <MissionChat missionId={m.id} role="OPERATOR" senderId={operator?.name || 'Operator'} />
                    </div>
'''

new_content = content.replace(target, target + insert_str)
open('src/pages/OperatorDashboard.tsx', 'w').write(new_content)
