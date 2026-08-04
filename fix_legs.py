import sys
content = open('src/pages/ICCDashboard.tsx').read()
old = '''                              <div className="bg-black/30 p-3 rounded-lg text-xs font-mono">
                                {m.legs && m.legs.length > 0 ? (
                                  m.legs.map((leg: any, idx: number) => (
                                    <div key={idx} className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                                      <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {leg.origin || leg.departure || leg.from}</p>
                                      <p className="text-white"><span className="text-gray-500">DEST:</span> {leg.destination || leg.to}</p>
                                      <p className="text-[10px] text-gray-500">{leg.date}</p>
                                    </div>
                                  ))
                                ) : m.departure_airport || m.destination_airport ? ('''

new = '''                              <div className="bg-black/30 p-3 rounded-lg text-xs font-mono">
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
                                    return ('''

old2 = '''                                ) : (
                                  m.raw_payload && (m.raw_payload.origin || m.raw_payload.departure || m.raw_payload.destination) ? (
                                    <div className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                                      <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {m.raw_payload.origin || m.raw_payload.departure || 'N/A'} {m.raw_payload.origin_airport ? \`(\${m.raw_payload.origin_airport})\` : ''}</p>
                                      <p className="text-white"><span className="text-gray-500">DEST:</span> {m.raw_payload.destination || 'N/A'} {m.raw_payload.destination_airport ? \`(\${m.raw_payload.destination_airport})\` : ''}</p>
                                      {m.raw_payload.date && <p className="text-[10px] text-gray-500">{m.raw_payload.date}</p>}
                                    </div>
                                  ) : 'No routing provided'
                                )}
                              </div>'''

new2 = '''                                    );
                                  }
                                  if (m.raw_payload && (m.raw_payload.origin || m.raw_payload.departure || m.raw_payload.destination)) {
                                    return (
                                      <div className="mb-2 last:mb-0 border-l-2 border-fbblue/30 pl-2">
                                        <p className="text-white"><span className="text-gray-500">ORIGIN:</span> {m.raw_payload.origin || m.raw_payload.departure || 'N/A'} {m.raw_payload.origin_airport ? \`(\${m.raw_payload.origin_airport})\` : ''}</p>
                                        <p className="text-white"><span className="text-gray-500">DEST:</span> {m.raw_payload.destination || 'N/A'} {m.raw_payload.destination_airport ? \`(\${m.raw_payload.destination_airport})\` : ''}</p>
                                        {m.raw_payload.date && <p className="text-[10px] text-gray-500">{m.raw_payload.date}</p>}
                                      </div>
                                    );
                                  }
                                  return 'No routing provided';
                                })()}
                              </div>'''

if old in content:
    content = content.replace(old, new)
    content = content.replace(old2, new2)
    open('src/pages/ICCDashboard.tsx', 'w').write(content)
    print('Updated ICCDashboard legs')
else:
    print('Not found')
