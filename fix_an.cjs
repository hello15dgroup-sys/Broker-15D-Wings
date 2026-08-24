const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the line that starts with `          {[` and `            "ACTIVATED",`
content = content.replace(
  /          \{\[\r?\n            "ACTIVATED",/,
  `            </motion.div>
          )}
          </AnimatePresence>
          {[
            "ACTIVATED",`
);

fs.writeFileSync(file, content);
console.log("Added closing tags.");
