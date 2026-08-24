const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change root container bg
content = content.replace(
  '<div className="relative min-h-screen bg-black text-white font-lexend pt-24 pb-20 px-4 md:px-8">',
  `<div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900 font-space pt-24 pb-20 px-4 md:px-8">
      {/* Background jet interior overlay (subtle) */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-cover bg-center mix-blend-multiply"
        style={{ backgroundImage: "url('/src/assets/images/private_jet_interior_light_1787553612955.jpg')" }}
      />
      <div className="relative z-10">`
);

// Close the wrapper div at the end of the return statement
content = content.replace(
  '    </div>\n  );\n}\n',
  '      </div>\n    </div>\n  );\n}\n'
);

// 2. Change "FLIGHT CONCIERGE DESK" text to lowercase/friendly luxury
content = content.replace(
  '<h1 className="font-sync text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white uppercase">\n                FLIGHT CONCIERGE DESK\n              </h1>',
  `<h1 className="font-space text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 lowercase flex items-center gap-4">
                flight concierge desk ✈️
              </h1>`
);

// 3. Update tabs rendering 
// Need to find the exact block and replace it.
const tabsRegex = /\{\/\* BROKER DESK NAVIGATION TABS \*\/\}\s*<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-white\/10">[\s\S]*?(?=<\/div>\n\n\s*\{\/\* TAB CONTENT: CRM WORKSPACE \*\/\})/g;
const newTabs = `{/* BROKER DESK NAVIGATION TABS */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide border-b border-purple-200/50 mb-8 items-center justify-start">
            <button
              onClick={() => setActiveTab('crm_workspace')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'crm_workspace'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <Users className="w-4 h-4" /> crm workspace
            </button>
            <button
              onClick={() => setActiveTab('proposal_builder')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'proposal_builder'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <FileText className="w-4 h-4" /> proposal builder
            </button>
            <button
              onClick={() => setActiveTab('booking_code')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'booking_code'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <Link className="w-4 h-4" /> client booking link
            </button>
            <button
              onClick={() => setActiveTab('checkout_engine')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'checkout_engine'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <CreditCard className="w-4 h-4" /> payment & escrow
            </button>
            <button
              onClick={() => setActiveTab('operational_radar')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'operational_radar'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <Radar className="w-4 h-4" /> fleet tracking
            </button>
            <button
              onClick={() => setActiveTab('telemetry_vault')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'telemetry_vault'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_10px_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <Database className="w-4 h-4" /> flight logs
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={\`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border \${
                activeTab === 'status'
                  ? 'bg-purple-100 text-purple-900 border-purple-200 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-purple-600 hover:bg-purple-50 shadow-sm'
              }\`}
            >
              <Info className="w-4 h-4" /> flight details
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("broker_verified");
                setSessionVerified(false);
                showToast("Signed out successfully. Returning to login portal.", "info");
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-space tracking-tight font-bold transition-all lowercase whitespace-nowrap shrink-0 border bg-white text-red-500 border-gray-200 hover:text-white hover:bg-red-500 hover:border-red-500 shadow-sm ml-auto"
            >
              <LogOut className="w-4 h-4" /> exit
            </button>`;

if(content.match(tabsRegex)) {
  content = content.replace(tabsRegex, newTabs);
} else {
  console.log("Could not find tabs regex!");
}

// Ensure icon imports exist
if(!content.includes('Users,') && content.includes('lucide-react')) {
  content = content.replace('lucide-react";', 'Users, FileText, Link, CreditCard, Radar, Database, Info } from "lucide-react";');
}

fs.writeFileSync(file, content, 'utf8');
console.log("Done");
