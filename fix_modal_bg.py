import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

old_class = "className=\"w-full max-w-lg p-6 md:p-8 rounded-[2.5rem] border border-purple-200 glass-vip bg-gradient-to-br from-[#0a1220]/95 via-black/95 to-[#050810]/95 shadow-[0_0_60px_rgba(0,0,0,0.85)] space-y-6 text-left relative\""
new_class = "className=\"w-full max-w-lg p-6 md:p-8 rounded-[2.5rem] border border-purple-200 bg-white shadow-2xl shadow-purple-900/10 space-y-6 text-left relative\""

if old_class in content:
    content = content.replace(old_class, new_class)
else:
    print("Class not found!")

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
