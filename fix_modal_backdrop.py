import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

old_backdrop = "className=\"fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-md backdrop-blur-[10px] p-4\""
new_backdrop = "className=\"fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4\""

if old_backdrop in content:
    content = content.replace(old_backdrop, new_backdrop)
else:
    print("Backdrop not found!")

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
