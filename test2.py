import sys
content = open('src/pages/ICCDashboard.tsx').read()
content = content.replace("'gio_intel_access'", "'gio_intel'")
open('src/pages/ICCDashboard.tsx', 'w').write(content)
print('Updated ICCDashboard.tsx to use gio_intel')
