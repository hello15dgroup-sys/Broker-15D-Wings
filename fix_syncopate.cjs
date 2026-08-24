const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<h2 className="font-space lowercase font-light text-xl md:text-2xl tracking-[0.25em] text-gray-900 lowercase pt-1">\n              {authStep === \'LOGIN\' ? \'FLIGHT BROKER\' : authStep === \'SIGNUP\' ? \'CREATE BROKER ACCOUNT\' : \'SMS VERIFICATION\'}\n            </h2>',
  `<h2 className="font-sync uppercase font-bold text-xl md:text-2xl tracking-[0.2em] text-gray-900 pt-1">
              {authStep === 'LOGIN' ? 'FLIGHT BROKER' : authStep === 'SIGNUP' ? 'CREATE BROKER ACCOUNT' : 'SMS VERIFICATION'}
            </h2>`
);

content = content.replace(
  '<span className="font-space lowercase text-[10px] text-gray-600 tracking-[0.38em] font-bold block lowercase">\n              15D WINGS\n            </span>',
  `<span className="font-sync uppercase text-[10px] text-gray-600 tracking-[0.3em] font-bold block">
              15D WINGS
            </span>`
);

content = content.replace(
  '<p className="font-space lowercase text-purple-600 tracking-[0.3em] text-[9px] lowercase font-semibold pt-1">\n              {authStep === \'LOGIN\' ? \'BROKER PORTAL LOGIN\' : authStep === \'SIGNUP\' ? \'PHASE 1 REGISTRATION\' : \'MOBILE OTP VERIFICATION\'}\n            </p>',
  `<p className="font-sync uppercase text-purple-600 tracking-[0.3em] text-[9px] font-bold pt-1">
              {authStep === 'LOGIN' ? 'BROKER PORTAL LOGIN' : authStep === 'SIGNUP' ? 'PHASE 1 REGISTRATION' : 'MOBILE OTP VERIFICATION'}
            </p>`
);

// We need to also change bg-[#07090e] text-gray-900 ... to be light mode so the card shows up well
content = content.replace(
  '<div className="relative min-h-screen bg-[#07090e] text-gray-900 flex items-center justify-center p-4 md:p-6 font-lexend overflow-hidden">',
  '<div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900 flex items-center justify-center p-4 md:p-6 font-space overflow-hidden">'
);

fs.writeFileSync(file, content);
console.log("Fixed syncopate and background for login portal.");
