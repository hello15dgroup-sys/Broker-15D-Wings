const fs = require('fs');
const file = 'src/pages/BrokerPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIndex = content.indexOf('{/* BROKER DESK NAVIGATION TABS */}');
const endIndex = content.indexOf('{/* ACTIVE BROKER MODULE RENDERER */}');

if (startIndex !== -1 && endIndex !== -1) {
  const newTabs = `{/* BROKER DESK NAVIGATION TABS */}
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide border-b border-purple-200 mb-8 items-center justify-start">
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
            </button>
          </div>

          `;

  content = content.substring(0, startIndex) + newTabs + content.substring(endIndex);
  
  // Replace imports
  content = content.replace(/import \{([\s\S]*?)\} from "lucide-react";/g, (match) => {
    let newImports = match;
    const iconsToAdd = ['Users', 'FileText', 'Link', 'CreditCard', 'Radar', 'Database', 'Info'];
    iconsToAdd.forEach(icon => {
      if (!newImports.includes(icon)) {
        newImports = newImports.replace('} from "lucide-react";', `, ${icon} } from "lucide-react";`);
      }
    });
    return newImports;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully replaced tabs");
} else {
  console.log("Could not find start or end index");
}
