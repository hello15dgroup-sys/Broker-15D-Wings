const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Wrap status tab with motion.div
content = content.replace(
  "{activeTab === 'status' && (\n            <div className=\"grid md:grid-cols-2 gap-4\">",
  `{activeTab === 'status' && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
              <div className="grid md:grid-cols-2 gap-4">`
);

// 2. Find the end of status tab and close motion.div
// The end of status tab is just before the `[ "ACTIVATED", "EXECUTING",` block.
content = content.replace(
  /              <\/div>\n            <\/div>\n          <\/div>\n          \{\[\n            "ACTIVATED",/g,
  `              </div>\n            </div>\n          </div>\n            </motion.div>\n          )}\n          </AnimatePresence>\n          {[\n            "ACTIVATED",`
);

fs.writeFileSync(file, content);
console.log("Status tab wrapped.");
