ALTER TABLE gio_intel_access ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE gio_intel_access ADD COLUMN IF NOT EXISTS clearance_level TEXT DEFAULT 'Tier 1';
ALTER TABLE gio_intel_access ADD COLUMN login_hash TEXT;
ALTER TABLE gio_intel_access ADD COLUMN hash_expires_at TIMESTAMPTZ;

-- Ensure the email is indexed for fast lookup during login
DROP INDEX IF EXISTS idx_gio_email;
CREATE UNIQUE INDEX idx_gio_email ON gio_intel_access(email);

CREATE OR REPLACE FUNCTION verify_gio_login(input_email TEXT, input_hash TEXT)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM gio_intel_access 
    WHERE email = input_email AND login_hash = input_hash 
    AND hash_expires_at > NOW();

    IF FOUND THEN
        RETURN jsonb_build_object('authenticated', true, 'role', user_record.clearance_level);
    ELSE
        RETURN jsonb_build_object('authenticated', false, 'message', 'Invalid or expired credentials');
    END IF;
END;
$$ LANGUAGE plpgsql;
