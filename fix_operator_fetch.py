import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

# Add effect to fetch operator
effect_code = """
  useEffect(() => {
    async function checkOperator() {
      if (!sessionVerified) return;
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;
        
        const { data: broker } = await supabase.from('brokers').select('id').eq('auth_user_id', user.user.id).single();
        if (!broker) return;

        const { data: operators } = await supabase.from('operators').select('id').eq('onboarded_by_broker_id', broker.id);
        if (operators && operators.length > 0) {
          setHasVerifiedOperator(true);
        }
      } catch (e) {
        console.error('Error checking operator:', e);
      }
    }
    checkOperator();
  }, [sessionVerified]);
"""

session_effect_end = r"return \(\) => subscription\.unsubscribe\(\);\n  \}, \[\]\);"
content = re.sub(session_effect_end, session_effect_end + "\n" + effect_code, content)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
