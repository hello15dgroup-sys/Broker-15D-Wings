import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

timeline_html = """
                          {/* Broker-to-Principal Communication Timeline */}
                          <div className="pt-3 border-t border-white/10 space-y-2">
                            <h5 className="text-[10px] text-gray-400 font-sync uppercase font-bold tracking-wider mb-2">Communication Timeline</h5>
                            <div className="space-y-1.5 border-l border-fbblue/30 pl-2 ml-1">
                                <div className="text-[9px] text-gray-300 font-mono">
                                    <span className="text-emerald-400">●</span> {deal.lastUpdated} - Proposal Sent to Principal
                                </div>
                                <div className="text-[9px] text-gray-300 font-mono">
                                    <span className="text-fbblue">●</span> Inquiry Received & Structured
                                </div>
                            </div>
                          </div>
"""

# Let's insert this timeline right after the `border-t border-white/10` section inside the deal card.
# The deal card has a `<div className="pt-2 flex flex-col gap-1.5 border-t border-white/10">`
content = content.replace(
    '<div className="pt-2 flex flex-col gap-1.5 border-t border-white/10">',
    '<div className="pt-2 flex flex-col gap-1.5 border-t border-white/10">\n' + timeline_html
)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
