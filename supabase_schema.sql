-- 15D Wings - Certainty Architecture
-- Idempotent Supabase Schema Initialization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. operator_access_codes
CREATE TABLE IF NOT EXISTS public.operator_access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    access_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. missions
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    pax INTEGER,
    aircraft_class TEXT,
    selected_aircraft_tail TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    payment_receipt_url TEXT,
    estimated_lower NUMERIC,
    estimated_upper NUMERIC,
    legs JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. mission_customizations
CREATE TABLE IF NOT EXISTS public.mission_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
    cci_level TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. operators
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_code TEXT UNIQUE,
    name TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    compliance_status TEXT NOT NULL DEFAULT 'PENDING',
    compliance_score INTEGER DEFAULT 0,
    availability_score INTEGER DEFAULT 0,
    relationship_score INTEGER DEFAULT 0,
    wire_bank_name TEXT,
    wire_routing_number TEXT,
    wire_account_number TEXT,
    wire_swift_code TEXT,
    wire_bank_address TEXT,
    wire_intermediary_bank TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. operator_leads
CREATE TABLE IF NOT EXISTS public.operator_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    wire_bank_name TEXT,
    wire_routing_number TEXT,
    wire_account_number TEXT,
    wire_swift_code TEXT,
    aoc_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. gio_intel_access
CREATE TABLE IF NOT EXISTS public.gio_intel_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegation_token TEXT NOT NULL UNIQUE,
    cleared_by UUID REFERENCES auth.users(id),
    label TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. gio_applicants
CREATE TABLE IF NOT EXISTS public.gio_applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RPC Functions (Certainty Architecture)
-- ============================================

-- RPC: verify_mission_payment
CREATE OR REPLACE FUNCTION public.verify_mission_payment(p_mission_id UUID, p_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.missions 
    SET payment_status = p_status, 
        updated_at = NOW()
    WHERE id = p_mission_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: submit_payment_receipt
CREATE OR REPLACE FUNCTION public.submit_payment_receipt(p_mission_id UUID, p_receipt_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.missions 
    SET payment_receipt_url = p_receipt_url,
        payment_status = 'AWAITING_VERIFICATION',
        updated_at = NOW()
    WHERE id = p_mission_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: update_mission_via_token
CREATE OR REPLACE FUNCTION public.update_mission_via_token(
    p_mission_id UUID, 
    p_aircraft_tail TEXT, 
    p_customizations JSONB, 
    p_clear_aircraft BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if locked
    IF EXISTS (SELECT 1 FROM public.missions WHERE id = p_mission_id AND status = 'ACTIVATED') THEN
        RAISE EXCEPTION 'Mission configuration is locked.';
    END IF;

    IF p_clear_aircraft THEN
        UPDATE public.missions SET selected_aircraft_tail = NULL, updated_at = NOW() WHERE id = p_mission_id;
    ELSIF p_aircraft_tail IS NOT NULL THEN
        UPDATE public.missions SET selected_aircraft_tail = p_aircraft_tail, updated_at = NOW() WHERE id = p_mission_id;
    END IF;

    -- Upsert customizations
    IF p_customizations IS NOT NULL AND p_customizations != '{}'::jsonb THEN
        INSERT INTO public.mission_customizations (mission_id, cci_level, details)
        VALUES (p_mission_id, 'USER_UPDATED', p_customizations)
        ON CONFLICT (id) DO UPDATE SET details = EXCLUDED.details, updated_at = NOW();
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: request_operator_verification
CREATE OR REPLACE FUNCTION public.request_operator_verification(p_access_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.operators 
    SET verification_status = 'AWAITING_REVIEW',
        updated_at = NOW()
    WHERE access_code = p_access_code;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.operator_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gio_intel_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gio_applicants ENABLE ROW LEVEL SECURITY;

-- Allow public access for now since this is a demo environment without strict JWT roles set up
CREATE POLICY "Allow public read access" ON public.operator_access_codes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.operator_access_codes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.missions FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.mission_customizations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.mission_customizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.mission_customizations FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.operators FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.operators FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.operators FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.operator_leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.operator_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.operator_leads FOR UPDATE USING (true);

-- GIO Intel Policies (RLS adjustment)
CREATE POLICY "Allow public read access" ON public.gio_intel_access FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.gio_intel_access FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.gio_intel_access FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.gio_applicants FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.gio_applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.gio_applicants FOR UPDATE USING (true);
