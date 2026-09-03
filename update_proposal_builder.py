with open('src/components/broker/WhiteLabelProposalBuilder.tsx', 'r') as f:
    content = f.read()

# Add supabase and ShieldAlert import if not already there
if "import { supabase }" not in content:
    content = "import { supabase } from '../../lib/supabase';\nimport { ShieldAlert, Lock } from 'lucide-react';\n" + content

old_props = """interface WhiteLabelProposalBuilderProps {
  missionId?: string;
  originCode?: string;
  destCode?: string;
  aircraftName?: string;
  baselineWholesaleCostUsd?: number;"""

new_props = """interface WhiteLabelProposalBuilderProps {
  missionId?: string;
  originCode?: string;
  destCode?: string;
  aircraftName?: string;
  baselineWholesaleCostUsd?: number;
  isVerified?: boolean;"""

content = content.replace(old_props, new_props)

old_comp_start = """export const WhiteLabelProposalBuilder: React.FC<WhiteLabelProposalBuilderProps> = ({
  missionId = '15D-892',
  originCode = 'LOS',
  destCode = 'ABV',
  aircraftName = 'Midsize Jet (Hawker 900XP)',
  baselineWholesaleCostUsd = 16250,
  onProposalGenerated
}) => {"""

new_comp_start = """export const WhiteLabelProposalBuilder: React.FC<WhiteLabelProposalBuilderProps> = ({
  missionId = '15D-892',
  originCode = 'LOS',
  destCode = 'ABV',
  aircraftName = 'Midsize Jet (Hawker 900XP)',
  baselineWholesaleCostUsd = 16250,
  isVerified,
  onProposalGenerated
}) => {
  const [isBackendVerified, setIsBackendVerified] = useState<boolean | null>(isVerified !== undefined ? isVerified : null);

  useEffect(() => {
    if (isVerified !== undefined) {
      setIsBackendVerified(isVerified);
      return;
    }
    async function checkVerification() {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user) {
          setIsBackendVerified(false);
          return;
        }
        const { data: broker } = await supabase
          .from('brokers')
          .select('id, is_verified')
          .eq('auth_user_id', user.user.id)
          .maybeSingle();

        if (broker?.is_verified) {
          setIsBackendVerified(true);
          return;
        }

        if (broker?.id) {
          const { data: operators } = await supabase
            .from('operators')
            .select('id, is_verified')
            .eq('onboarded_by_broker_id', broker.id);

          if (operators && operators.length > 0 && operators.some(o => o.is_verified)) {
            setIsBackendVerified(true);
            return;
          }
        }
        setIsBackendVerified(false);
      } catch (e) {
        console.error('Error verifying broker in ProposalBuilder:', e);
        setIsBackendVerified(false);
      }
    }
    checkVerification();
  }, [isVerified]);"""

content = content.replace(old_comp_start, new_comp_start)

# Add security return before render
return_gate = """  if (isBackendVerified === false) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 md:p-12 rounded-[2.5rem] border border-amber-200 bg-white/95 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sync font-bold tracking-widest uppercase inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-700" /> Charlatan Protection Active • Clearance Required
          </span>
          <h3 className="font-space font-bold text-xl md:text-2xl text-gray-900 uppercase tracking-tight">
            Proposal Designer Restricted
          </h3>
          <p className="font-lexend text-xs md:text-sm text-gray-700 leading-relaxed max-w-lg mx-auto">
            This tool is strictly locked. No pricing proposals can be generated or downloaded without verified broker clearance from the 15D Wings compliance registry.
          </p>
        </div>
      </div>
    );
  }

  return ("""

content = content.replace("  return (", return_gate, 1)

with open('src/components/broker/WhiteLabelProposalBuilder.tsx', 'w') as f:
    f.write(content)

print("Updated WhiteLabelProposalBuilder.tsx")
