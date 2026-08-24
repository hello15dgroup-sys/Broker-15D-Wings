const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `              </div>
            </div>
          </div>
          {[
            "ACTIVATED",`;
            
const replacement = `              </div>
            </div>
          </div>
            </motion.div>
          )}
          </AnimatePresence>
          {[
            "ACTIVATED",`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Replaced block");
