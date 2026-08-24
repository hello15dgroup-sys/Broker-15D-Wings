const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// The activeTab === 'status' is opened around line 2343.
// We need to close it before `{[ "ACTIVATED"`.

// Let's find:
/*
              </div>
            </div>
          </div>
          {[
            "ACTIVATED",
*/
content = content.replace(
  /              <\/div>\r?\n            <\/div>\r?\n          <\/div>\r?\n          \{\[\r?\n            "ACTIVATED",/,
  `              </div>
            </div>
          </div>
            </motion.div>
          )}
          </AnimatePresence>
          {[
            "ACTIVATED",`
);

fs.writeFileSync(file, content);
console.log("Fixed status close.");
