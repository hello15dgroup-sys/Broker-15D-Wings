import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

# Add OperatorOnboardingModal import
if "OperatorOnboardingModal" not in content:
    content = content.replace(
        'import { WhiteLabelProposalBuilder } from "../components/broker/WhiteLabelProposalBuilder";',
        'import { WhiteLabelProposalBuilder } from "../components/broker/WhiteLabelProposalBuilder";\nimport { OperatorOnboardingModal } from "../components/broker/OperatorOnboardingModal";'
    )

# Add brokerDbRecord state
state_search = 'const [hasVerifiedOperator, setHasVerifiedOperator] = useState(false);'
state_replace = """const [hasVerifiedOperator, setHasVerifiedOperator] = useState(false);
  const [brokerDbRecord, setBrokerDbRecord] = useState<{
    id: string;
    referral_code?: string;
    company_name?: string;
    email?: string;
    is_verified?: boolean;
  } | null>(null);"""

if "brokerDbRecord" not in content:
    content = content.replace(state_search, state_replace)

# Update checkOperator to store brokerDbRecord
old_check = """        const { data: broker } = await supabase
          .from('brokers')
          .select('id, is_verified')
          .eq('auth_user_id', user.user.id)
          .maybeSingle();"""

new_check = """        const { data: broker } = await supabase
          .from('brokers')
          .select('id, referral_code, company_name, email, is_verified')
          .eq('auth_user_id', user.user.id)
          .maybeSingle();
        
        if (broker) {
          setBrokerDbRecord(broker);
        }"""

content = content.replace(old_check, new_check)

# Replace old AOC modal at the bottom with OperatorOnboardingModal
old_modal_regex = r"\{showAOCModal && \(\s*<motion\.div\s*initial=\{\{ opacity: 0 \}\}.*?</motion\.div>\s*\)\}"

new_modal_code = """<OperatorOnboardingModal
          isOpen={showAOCModal}
          onClose={() => setShowAOCModal(false)}
          brokerId={brokerDbRecord?.id}
          brokerReferralCode={brokerDbRecord?.referral_code}
          brokerEmail={brokerDbRecord?.email || inputEmail}
          brokerCompany={brokerDbRecord?.company_name || brokerCompany}
          onVerificationSuccess={() => {
            setHasVerifiedOperator(true);
            showToast("Licensed operator clearance verified on backend! Proposal tools unlocked.", "success");
          }}
        />"""

content = re.sub(old_modal_regex, new_modal_code, content, flags=re.DOTALL)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)

print("Updated BrokerPortal.tsx successfully with OperatorOnboardingModal")
