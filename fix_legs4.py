import sys
content = open('src/pages/ICCDashboard.tsx').read()
content = content.replace('<p className="text-gray-300">Routing (L                               <div className="bg-black/30 p-3 rounded-lg text-xs font-mono">', '<p className="text-gray-300">Routing (Legs / Payload):</p>\n                               <div className="bg-black/30 p-3 rounded-lg text-xs font-mono">')
open('src/pages/ICCDashboard.tsx', 'w').write(content)
