const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Modals backgrounds
content = content.replace(/bg-black(?= rounded-3xl| sticky top-0| shadow-2xl)/g, 'bg-white');
content = content.replace(/bg-\[\#090d16\]/g, 'bg-white');
content = content.replace(/bg-\[\#03060c\]/g, 'bg-white');

// Background panels
content = content.replace(/bg-black\/[45678]0/g, 'bg-white/80 backdrop-blur-md');
content = content.replace(/bg-white\/\[0\.0[358]\]/g, 'bg-white/90');
content = content.replace(/bg-white\/5/g, 'bg-purple-50');
content = content.replace(/bg-white\/10/g, 'bg-purple-100');

// Text colors
content = content.replace(/text-white/g, 'text-gray-900');
content = content.replace(/text-gray-400/g, 'text-gray-600');
content = content.replace(/text-gray-300/g, 'text-gray-700');

// Borders
content = content.replace(/border-white\/10/g, 'border-purple-200');
content = content.replace(/border-white\/5/g, 'border-purple-100');
content = content.replace(/border-white\/20/g, 'border-purple-300');

// Typo: "font-sync" -> "font-space lowercase"
// We want to make headers friendly.
content = content.replace(/font-sync/g, 'font-space lowercase');

// Uppercase to lowercase in classNames
content = content.replace(/uppercase/g, 'lowercase');

// Specific overrides to fix some modals or buttons that now might have text-gray-900 on fbblue
content = content.replace(/bg-fbblue text-gray-900/g, 'bg-purple-600 text-white');
content = content.replace(/text-fbblue/g, 'text-purple-600');
content = content.replace(/bg-fbblue\/10/g, 'bg-purple-100');
content = content.replace(/border-fbblue/g, 'border-purple-500');
content = content.replace(/bg-fbblue/g, 'bg-purple-600');

// Ensure the button icons still look good
content = content.replace(/text-gray-900(?=\s+(font-space|font-bold|w-|h-|shrink))/g, 'text-gray-900'); 

// "FLIGHT CONCIERGE DESK" is already fixed, but let's make sure there are no other weird text color issues.

fs.writeFileSync(file, content, 'utf8');
console.log("Style replacements completed.");
