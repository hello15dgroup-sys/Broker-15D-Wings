CREATE OR REPLACE FUNCTION verify_gio_login(input_email TEXT, input_hash TEXT)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM gio_intel 
    WHERE email = input_email AND login_hash = input_hash 
    AND hash_expires_at > NOW();

    IF FOUND THEN
        RETURN jsonb_build_object('authenticated', true, 'role', user_record.clearance_level);
    ELSE
        RETURN jsonb_build_object('authenticated', false, 'message', 'Invalid or expired credentials');
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RETURN jsonb_build_object('authenticated', false, 'message', 'Table not found');
END;
$$ LANGUAGE plpgsql;
