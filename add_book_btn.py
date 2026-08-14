import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

btn_html = """
          <button
            onClick={() => window.open('/vip-booking.html', '_blank')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-fbblue hover:bg-fbblue/90 text-white rounded-xl text-[10px] font-bold font-sync uppercase transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)]"
          >
            <Plane className="w-3.5 h-3.5" />
            BOOK FLIGHT
          </button>
"""

# Let's insert it near the top header of the workspace
# Search for <h2 className="ui-sync text-lg text-white font-bold tracking-widest uppercase">
content = content.replace(
    '<h2 className="ui-sync text-lg text-white font-bold tracking-widest uppercase">',
    btn_html + '\n          <h2 className="ui-sync text-lg text-white font-bold tracking-widest uppercase">'
)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
