const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /              <\/div>\r?\n            \)\}\r?\n          \{\}/,
  `              </div>`
);

fs.writeFileSync(file, content);
console.log("Fixed bracket.");
