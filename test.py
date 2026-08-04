import sys
content = open('src/pages/GIOInterface.tsx').read()
old = '''  const handleAuth = async () => {
    if (!email || !password) {
      setError('Credentials incomplete.');
      return;
    }
    setLoading(true);
    setError('');
    
    // Use the RPC verify_gio_login
    const { data, error: rpcError } = await supabase.rpc('verify_gio_login', {
      input_email: email,
      input_hash: password
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    if (data && data.authenticated) {
      setLoading(false);
      onLogin();
    } else {
      setError(data?.message || 'Invalid or expired credentials');
      setLoading(false);
    }
  };'''

new = '''  const handleAuth = async () => {
    if (!email || !password) {
      setError('Credentials incomplete.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // Direct query to gio_intel table
      const { data, error: queryError } = await supabase
        .from('gio_intel')
        .select('*')
        .eq('email', email)
        .eq('login_hash', password)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      if (data) {
        if (new Date(data.hash_expires_at).getTime() > Date.now()) {
          setLoading(false);
          onLogin();
        } else {
          setError('Invalid or expired credentials');
          setLoading(false);
        }
      } else {
        // Fallback to RPC in case table name is different or they only created RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('verify_gio_login', {
          input_email: email,
          input_hash: password
        });

        if (rpcData && rpcData.authenticated) {
          setLoading(false);
          onLogin();
        } else {
          setError(rpcData?.message || 'Invalid or expired credentials');
          setLoading(false);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
      setLoading(false);
    }
  };'''

if old in content:
    open('src/pages/GIOInterface.tsx', 'w').write(content.replace(old, new))
    print('Updated handleAuth directly querying gio_intel')
else:
    print('Not found')
