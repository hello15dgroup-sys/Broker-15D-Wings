const fs = require('fs');

const files = [
  'src/components/broker/WhiteLabelProposalBuilder.tsx',
  'src/components/broker/SystemizedCheckoutEngine.tsx',
  'src/components/broker/BrokerCRMWorkspace.tsx',
  'src/components/broker/BookingCodeGenerator.tsx',
  'src/components/broker/PremiumBookFlightPanel.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Modals backgrounds
    content = content.replace(/bg-black\/[45678]0/g, 'bg-white/80 backdrop-blur-md');
    content = content.replace(/bg-white\/\[0\.0[358]\]/g, 'bg-white/90');
    content = content.replace(/bg-white\/5/g, 'bg-purple-50');
    content = content.replace(/bg-white\/10/g, 'bg-purple-100');
    content = content.replace(/bg-\[\#0a1220\]/g, 'bg-white');
    content = content.replace(/bg-\[\#0f172a\]/g, 'bg-slate-50');

    // Text colors
    content = content.replace(/text-white/g, 'text-gray-900');
    content = content.replace(/text-gray-400/g, 'text-gray-600');
    content = content.replace(/text-gray-300/g, 'text-gray-700');

    // Borders
    content = content.replace(/border-white\/10/g, 'border-purple-200');
    content = content.replace(/border-white\/5/g, 'border-purple-100');
    content = content.replace(/border-white\/20/g, 'border-purple-300');

    content = content.replace(/font-sync/g, 'font-space lowercase');
    content = content.replace(/uppercase/g, 'lowercase');
    
    content = content.replace(/bg-fbblue text-gray-900/g, 'bg-purple-600 text-white');
    content = content.replace(/text-fbblue/g, 'text-purple-600');
    content = content.replace(/bg-fbblue\/10/g, 'bg-purple-100');
    content = content.replace(/border-fbblue/g, 'border-purple-500');
    content = content.replace(/bg-fbblue/g, 'bg-purple-600');
    content = content.replace(/from-fbblue/g, 'from-purple-600');
    content = content.replace(/to-fbblue/g, 'to-purple-800');

    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated " + file);
  }
}
