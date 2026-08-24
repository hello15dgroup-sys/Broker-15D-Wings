const fs = require('fs');

const files = [
  'src/components/broker/BookingCodeGenerator.tsx',
  'src/components/broker/BrokerCRMWorkspace.tsx',
  'src/components/broker/DecisionEngineCard.tsx',
  'src/components/broker/EyeOfGodTelemetry.tsx',
  'src/components/broker/OperationalIntegrityIndex.tsx',
  'src/components/broker/PremiumBookFlightPanel.tsx',
  'src/components/broker/WhiteLabelProposalBuilder.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Make modals bg-white instead of bg-black
    content = content.replace(/bg-black(?= rounded| border| p-| space-)/g, 'bg-white');
    content = content.replace(/bg-black\/[45678]0/g, 'bg-white/80 backdrop-blur-md');
    content = content.replace(/bg-black\/85/g, 'bg-white/80 backdrop-blur-md');
    
    // Backgrounds for modal backdrop
    content = content.replace(/bg-black\/9[05]/g, 'bg-black/40');

    // Text colors
    content = content.replace(/text-white/g, 'text-gray-900');
    content = content.replace(/text-gray-400/g, 'text-gray-600');
    content = content.replace(/text-gray-300/g, 'text-gray-700');

    // Borders
    content = content.replace(/border-white\/10/g, 'border-purple-200');
    content = content.replace(/border-white\/15/g, 'border-purple-200');
    content = content.replace(/border-white\/20/g, 'border-purple-300');

    // fbblue to purple
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
