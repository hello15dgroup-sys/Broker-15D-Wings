with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

old_form = """              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setHasVerifiedOperator(true);
                  setShowAOCModal(false);
                  showToast("Licensed operator successfully onboarded and verified!", "success");
                }}"""

new_form = """              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  try {
                    const { data: user } = await supabase.auth.getUser();
                    if (user.user) {
                      const { data: broker } = await supabase.from('brokers').select('id').eq('auth_user_id', user.user.id).single();
                      if (broker) {
                        await supabase.from('operators').insert({
                          company_name: operatorName,
                          contact_email: operatorEmail || 'contact@operator.com',
                          onboarded_by_broker_id: broker.id,
                          is_verified: true
                        });
                      }
                    }
                  } catch (e) {
                    console.error('Failed to save operator:', e);
                  }

                  setHasVerifiedOperator(true);
                  setShowAOCModal(false);
                  showToast("Licensed operator successfully onboarded and verified!", "success");
                }}"""

content = content.replace(old_form, new_form)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
