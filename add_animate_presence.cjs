const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '{/* ACTIVE BROKER MODULE RENDERER */}',
  '{/* ACTIVE BROKER MODULE RENDERER */}\n          <AnimatePresence mode="wait">'
);

// We need to close AnimatePresence after the last tab, which is 'status'.
const statusTabEnd = `              />
            </motion.div>
          )}

      </div>`;
      
// It might be better to just regex replace all `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>`
content = content.replace(
  /<motion\.div initial=\{\{ opacity: 0, y: 10 \}\} animate=\{\{ opacity: 1, y: 0 \}\}>/g,
  '<motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeInOut" }}>'
);

content = content.replace(
  /          \{\/\* Background jet interior overlay \(subtle\) \*\/\}/,
  '          {/* Background jet interior overlay (subtle) */}'
);

fs.writeFileSync(file, content, 'utf8');
