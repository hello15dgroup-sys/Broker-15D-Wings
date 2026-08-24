const fs = require('fs');

function replaceBlack(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-black\/[1-9]0/g, 'bg-black/40'); // For backdrops, bg-black/40 is standard semi-transparent dark overlay which is usually acceptable, but let's change them to bg-white/40 or bg-gray-900/40.
  // The user said "implement zero black cards all cards must be along the lines of white". Backdrops might be dark to focus on the card, but let's make the cards themselves white.
  // Looking at the grep, we have bg-black without opacity in `BrokerPortal.tsx` lines 1777 and 1799. Let's make them bg-white.
  content = content.replace(/bg-black(?= |"|'|\/40)/g, (match) => {
    if (match === 'bg-black') return 'bg-white';
    return match; // Keep bg-black/40 for backdrop if that's what we want, or change it to bg-gray-900/40
  });
  
  // Actually let's just make the backdrops bg-black/40 (already done in previous script for some). Wait, let's use bg-gray-900/40 instead to completely remove bg-black.
  content = content.replace(/bg-black\/40/g, 'bg-gray-900/40');
  content = content.replace(/bg-black\/90/g, 'bg-gray-900/40');
  content = content.replace(/bg-black\/60/g, 'bg-gray-900/40');
  content = content.replace(/bg-black\/80/g, 'bg-gray-900/40');

  fs.writeFileSync(file, content);
}

replaceBlack('src/pages/BrokerPortal.tsx');
replaceBlack('src/components/broker/EyeOfGodTelemetry.tsx');
replaceBlack('src/components/broker/OperationalIntegrityIndex.tsx');
replaceBlack('src/components/broker/PremiumBookFlightPanel.tsx');
replaceBlack('src/components/broker/WhiteLabelProposalBuilder.tsx');

console.log("Replaced bg-black everywhere.");
