import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

# Add a state for hasVerifiedOperator
state_injection = """  const [hasVerifiedOperator, setHasVerifiedOperator] = useState(false);
"""

content = content.replace(
    'const [sessionVerified, setSessionVerified] = useState(sessionStorage.getItem("broker_verified") === "true");',
    'const [sessionVerified, setSessionVerified] = useState(sessionStorage.getItem("broker_verified") === "true");\n' + state_injection
)

# In the render area, right after `if (!sessionVerified)`, we can add another condition:
# `if (sessionVerified && !hasVerifiedOperator) { return <Gate> }`

gate_ui = """
  if (sessionVerified && !hasVerifiedOperator) {
    return (
      <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 md:p-6 font-lexend overflow-hidden">
        <div className="z-10 w-full max-w-lg p-8 md:p-10 rounded-[2.5rem] space-y-6 border border-white/10 glass-vip shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-center">
            <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-sync font-bold text-2xl tracking-wider uppercase text-white">ACCESS RESTRICTED</h2>
            <p className="text-sm text-gray-400 font-mono mb-6">
                Your broker account has not been verified by a licensed operator.
                You have no access to these features until an operator verifies your credentials.
            </p>
            <button
                onClick={() => setHasVerifiedOperator(true)}
                className="w-full py-4 bg-fbblue hover:bg-fbblue/90 text-white rounded-xl text-xs font-bold font-sync uppercase shadow-[0_0_20px_rgba(24,119,242,0.4)]"
            >
                ONBOARD A LICENSED OPERATOR
            </button>
        </div>
      </div>
    );
  }
"""

content = content.replace(
    'if (!sessionVerified) {',
    gate_ui + '\n  if (!sessionVerified) {'
)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
