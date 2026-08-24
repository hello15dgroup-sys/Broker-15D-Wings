const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

const welcomeCard = `
          {/* Welcome Graphic Card */}
          <div className="w-full rounded-[2rem] bg-white shadow-xl border border-purple-100 overflow-hidden flex flex-col md:flex-row relative mt-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-white/10 pointer-events-none" />
            <div className="p-8 md:p-12 flex-1 flex flex-col justify-center z-10">
              <h2 className="font-space text-3xl font-bold text-gray-900 tracking-tight lowercase mb-4">
                welcome back to your luxury command center.
              </h2>
              <p className="font-space text-gray-600 text-lg leading-relaxed max-w-lg lowercase">
                everything you need to orchestrate seamless, world-class aviation experiences for your clients in one vibrant place.
              </p>
            </div>
            <div className="w-full md:w-1/3 aspect-square md:aspect-auto relative min-h-[250px]">
              <img 
                src="/src/assets/images/jet_illustration_friendly_1787553630770.jpg" 
                alt="Luxury Jet Graphic" 
                className="absolute inset-0 w-full h-full object-cover object-center mix-blend-multiply" 
              />
            </div>
          </div>
`;

content = content.replace(
  '            <div className="flex items-center gap-3">',
  '            <div className="flex items-center gap-3">' // Just to find it
);

content = content.replace(
  '          </header>',
  '          </header>\n' + welcomeCard
);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully added welcome card");
