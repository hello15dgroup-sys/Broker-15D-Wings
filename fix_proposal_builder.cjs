const fs = require('fs');
const file = 'src/components/broker/WhiteLabelProposalBuilder.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<h2 className="text-xl md:text-2xl font-light text-gray-900 font-space lowercase tracking-tight pt-1">\n            Custom VIP Proposal Designer\n          </h2>',
  `<h2 className="text-xl md:text-2xl font-bold text-gray-900 font-sync uppercase tracking-[0.1em] pt-1">
            Custom VIP Proposal Designer
          </h2>`
);

content = content.replace(
  '<span className="font-space lowercase text-xs text-purple-600 tracking-widest font-semibold block">\n              MODULE 2 — WHITE-LABEL PROPOSAL DESIGNER\n            </span>',
  `<span className="font-sync uppercase text-[10px] text-purple-600 tracking-widest font-bold block">
              MODULE 2 — WHITE-LABEL PROPOSAL DESIGNER
            </span>`
);

fs.writeFileSync(file, content);
console.log("Updated proposal builder syncopate.");
