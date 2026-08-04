-- =========================================================
-- 1. RLS Policies for ICC to Insert GIO Intel & Read Mission Customizations
-- =========================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.gio_intel_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_customizations ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies if you want to restrict this later, 
-- but here we ensure ICC has the necessary access:
DROP POLICY IF EXISTS "ICC can insert into gio_intel_access" ON public.gio_intel_access;
DROP POLICY IF EXISTS "ICC can read gio_intel_access" ON public.gio_intel_access;
DROP POLICY IF EXISTS "ICC can read mission_customizations" ON public.mission_customizations;

-- Allow ICC (and authenticated users) to Insert and Read from gio_intel_access
CREATE POLICY "ICC can insert into gio_intel_access" 
ON public.gio_intel_access FOR INSERT 
WITH CHECK (true); -- Note: use auth.role() = 'authenticated' for strict prod environments

CREATE POLICY "ICC can read gio_intel_access" 
ON public.gio_intel_access FOR SELECT 
USING (true);

CREATE POLICY "ICC can update gio_intel_access" 
ON public.gio_intel_access FOR UPDATE 
USING (true);

-- Allow ICC to see all details in mission_customizations
CREATE POLICY "ICC can read mission_customizations" 
ON public.mission_customizations FOR SELECT 
USING (true);

CREATE POLICY "ICC can insert mission_customizations" 
ON public.mission_customizations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "ICC can update mission_customizations" 
ON public.mission_customizations FOR UPDATE 
USING (true);


-- =========================================================
-- 2. Query / View for Operator Access Code Verification Status
-- =========================================================

-- This view joins the operator_access_codes table with the operators table
-- to show exactly who has an access code but hasn't registered or isn't verified.
CREATE OR REPLACE VIEW public.operator_verification_status AS
SELECT 
    oac.email,
    oac.company_name,
    oac.access_code,
    o.id AS operator_id,
    o.name AS registered_name,
    COALESCE(o.verification_status, 'UNREGISTERED') AS current_status
FROM 
    public.operator_access_codes oac
LEFT JOIN 
    public.operators o ON oac.access_code = o.access_code;

-- Example Query 1: View all operators who are UNREGISTERED or PENDING
-- SELECT * FROM public.operator_verification_status WHERE current_status != 'VERIFIED';

-- Example Query 2: Get the total count of unverified/unregistered operators
-- SELECT count(*) FROM public.operator_verification_status WHERE current_status != 'VERIFIED';
