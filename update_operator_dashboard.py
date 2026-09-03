with open('src/pages/OperatorDashboard.tsx', 'r') as f:
    content = f.read()

# Add referral tracking at top of OperatorDashboard
old_start = """  const [searchParams, setSearchParams] = useSearchParams();
  const sessionVerified = searchParams.get('verified') === 'true';
  const isPreview = searchParams.get('preview') === 'true';"""

new_start = """  const [searchParams, setSearchParams] = useSearchParams();
  const sessionVerified = searchParams.get('verified') === 'true';
  const isPreview = searchParams.get('preview') === 'true';
  const brokerRef = searchParams.get('broker_ref') || searchParams.get('ref') || searchParams.get('broker_id');

  useEffect(() => {
    if (brokerRef) {
      try {
        localStorage.setItem('15d_broker_ref', brokerRef);
      } catch {}
    }
  }, [brokerRef]);"""

content = content.replace(old_start, new_start)

# Add linkedBrokerId resolution in operator query
old_default_op = """      const defaultOp = {
        id: opId,
        user_id: isValidUuid ? userId : null,
        name: companyName,
        contact_email: emailAddress || 'hello.15dgroup@gmail.com',"""

new_default_op = """      const activeBrokerRef = brokerRef || (typeof localStorage !== 'undefined' ? localStorage.getItem('15d_broker_ref') : null);
      let linkedBrokerId: string | null = null;
      if (activeBrokerRef) {
        try {
          const { data: bData } = await supabase
            .from('brokers')
            .select('id')
            .or(`id.eq.${activeBrokerRef},referral_code.eq.${activeBrokerRef}`)
            .maybeSingle();
          if (bData) {
            linkedBrokerId = bData.id;
          }
        } catch (e) {}
      }

      const defaultOp = {
        id: opId,
        user_id: isValidUuid ? userId : null,
        name: companyName,
        contact_email: emailAddress || 'hello.15dgroup@gmail.com',
        onboarded_by_broker_id: linkedBrokerId,"""

content = content.replace(old_default_op, new_default_op)

with open('src/pages/OperatorDashboard.tsx', 'w') as f:
    f.write(content)

print("Updated OperatorDashboard.tsx")
