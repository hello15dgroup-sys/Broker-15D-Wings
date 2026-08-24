const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /              <\/div>\r?\n            \)\}\r?\n          <div className="pt-8">/,
  `              </div>
          <div className="pt-8">`
);

fs.writeFileSync(file, content);
console.log("Fixed 2648");
