import sys
content = open('src/pages/ICCDashboard.tsx').read()
start = content.find('<div className="bg-black/30 p-3 rounded-lg text-xs font-mono">')
end = content.find('                               {m.mission_customizations')
old_part = content[start:end]

new_part = '''<div className="bg-black/30 p-3 rounded-lg text-xs font-mono">
                                 {(() => {
                                   const parsedLegs = typeof m.legs === 'string' ? JSON.parse(m.legs) : m.legs;
                                   const legsArr = Array.isArray(parsedLegs) ? parsedLegs : [];
                                   if (legsArr.length > 0) {
                                     return legsArr.map((leg: any, idx: number) => (
                                       <div key={idx} className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                                         <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {leg.origin || leg.departure || leg.from}</p>
                                         <p className="text-white"><span className="text-gray-500">DEST:</span> {leg.destination || leg.to}</p>
                                         <p className="text-[10px] text-gray-500">{leg.date}</p>
                                       </div>
                                     ));
                                   }
                                   if (m.departure_airport || m.destination_airport) {
                                     return (
                                       <div className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                                         <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {m.departure_airport || 'N/A'}</p>
                                         <p className="text-white"><span className="text-gray-500">DEST:</span> {m.destination_airport || 'N/A'}</p>
                                       </div>
                                     );
                                   }
                                   if (m.raw_payload && (m.raw_payload.origin || m.raw_payload.departure || m.raw_payload.destination)) {
                                     return (
                                       <div className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                                         <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {m.raw_payload.origin || m.raw_payload.departure || 'N/A'} {m.raw_payload.origin_airport ? `(${m.raw_payload.origin_airport})` : ''}</p>
                                         <p className="text-white"><span className="text-gray-500">DEST:</span> {m.raw_payload.destination || 'N/A'} {m.raw_payload.destination_airport ? `(${m.raw_payload.destination_airport})` : ''}</p>
                                         {m.raw_payload.date && <p className="text-[10px] text-gray-500">{m.raw_payload.date}</p>}
                                       </div>
                                     );
                                   }
                                   return 'No routing provided';
                                 })()}
                               </div>
                               
'''

open('src/pages/ICCDashboard.tsx', 'w').write(content.replace(old_part, new_part))
print("Fixed syntax")
