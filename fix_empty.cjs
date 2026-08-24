const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\s*\{\}\s*<div className="pt-8">/, '\n          <div className="pt-8">');

fs.writeFileSync(file, content);
console.log("Fixed empty bracket.");
