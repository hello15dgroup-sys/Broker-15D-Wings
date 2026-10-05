-- =====================================================================
-- 15D WINGS BROKER SUITE — PRODUCTION SQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Single Source of Truth for Fleet Availability, Broker CRM, Team & Missions
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. BROKER PROFILES TABLE (Linked to Supabase Auth)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brokers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    company_name TEXT NOT NULL DEFAULT '15D Executive Aviation Brokerage',
    referral_code TEXT UNIQUE,
    commission_tier TEXT NOT NULL DEFAULT 'EXECUTIVE_PARTNER',
    aoc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    linked_operator_aoc TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. BROKERAGE TEAM SUB-ACCOUNTS (Team Members & Junior Brokers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broker_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'JUNIOR_BROKER' CHECK (role IN ('LEAD_BROKER', 'CHARTER_DISPATCHER', 'JUNIOR_BROKER', 'COMMISSION_ANALYST')),
    commission_split_pct NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    phone_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. FLEET AIRCRAFT AVAILABILITY (Live Network Jets)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fleet_aircraft (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tail_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Light Jet', 'Midsize Jet', 'Heavy Jet', 'Ultra Long Range', 'Turboprop')),
    home_hub_icao TEXT NOT NULL,
    home_hub_name TEXT NOT NULL,
    pax_capacity INTEGER NOT NULL DEFAULT 8,
    max_range_nm INTEGER NOT NULL DEFAULT 3500,
    cruise_speed_ktas INTEGER NOT NULL DEFAULT 450,
    hourly_rate_usd NUMERIC(10,2) NOT NULL,
    readiness_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (readiness_status IN ('READY_NOW', 'READY_90M', 'AVAILABLE', 'MAINTENANCE')),
    operator_name TEXT NOT NULL,
    aoc_number TEXT NOT NULL,
    is_verified_aoc BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. EMPTY LEGS (Discounted Repositioning Flights)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.empty_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aircraft_id UUID REFERENCES public.fleet_aircraft(id) ON DELETE SET NULL,
    origin_icao TEXT NOT NULL,
    origin_name TEXT NOT NULL,
    destination_icao TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    departure_datetime TIMESTAMPTZ NOT NULL,
    seats_available INTEGER NOT NULL DEFAULT 8,
    discounted_price_usd NUMERIC(10,2) NOT NULL,
    standard_price_usd NUMERIC(10,2) NOT NULL,
    discount_pct INTEGER NOT NULL DEFAULT 40,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'FEW_SEATS', 'HOLD', 'BOOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. HNWI CLIENTS DIRECTORY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broker_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone_number TEXT,
    client_type TEXT NOT NULL DEFAULT 'HNWI' CHECK (client_type IN ('HNWI', 'Corporate', 'Family Office', 'VIP Royal')),
    passport_number TEXT,
    preferred_aircraft TEXT,
    total_spent_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. BROKER CHARTER SALES PIPELINE & DEALS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broker_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.broker_clients(id) ON DELETE SET NULL,
    deal_title TEXT NOT NULL,
    origin_icao TEXT NOT NULL,
    destination_icao TEXT NOT NULL,
    departure_date DATE NOT NULL,
    aircraft_category TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'Inquiry' CHECK (stage IN ('Inquiry', 'Quote Sent', 'Proposal Viewed', 'Contract Signed', 'Commission Settled')),
    wholesale_cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    broker_markup_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_quote_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    commission_earned_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 7. BROKER ACTIONABLE TASKS & ALERTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broker_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GENERAL' CHECK (category IN ('SLOT_CLEARANCE', 'PAYMENT_ESCROW', 'MANIFEST_CHECK', 'GENERAL', 'CLIENT_FOLLOWUP')),
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('HIGH', 'NORMAL', 'URGENT')),
    due_date TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empty_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_tasks ENABLE ROW LEVEL SECURITY;

-- 2. Brokers Profile Policies
DROP POLICY IF EXISTS "Brokers can view own profile" ON public.brokers;
CREATE POLICY "Brokers can view own profile"
    ON public.brokers FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Brokers can update own profile" ON public.brokers;
CREATE POLICY "Brokers can update own profile"
    ON public.brokers FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Brokers can insert own profile" ON public.brokers;
CREATE POLICY "Brokers can insert own profile"
    ON public.brokers FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Broker Team Members Policies
DROP POLICY IF EXISTS "Brokers can manage own team members" ON public.broker_team_members;
CREATE POLICY "Brokers can manage own team members"
    ON public.broker_team_members FOR ALL
    USING (broker_id = auth.uid());

-- 4. Fleet & Empty Legs Policies (Read-accessible to authenticated brokers)
DROP POLICY IF EXISTS "Authenticated brokers can view fleet aircraft" ON public.fleet_aircraft;
CREATE POLICY "Authenticated brokers can view fleet aircraft"
    ON public.fleet_aircraft FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated brokers can view empty legs" ON public.empty_legs;
CREATE POLICY "Authenticated brokers can view empty legs"
    ON public.empty_legs FOR SELECT
    TO authenticated
    USING (true);

-- 5. Clients Policies
DROP POLICY IF EXISTS "Brokers can manage own clients" ON public.broker_clients;
CREATE POLICY "Brokers can manage own clients"
    ON public.broker_clients FOR ALL
    USING (broker_id = auth.uid());

-- 6. Deals Pipeline Policies
DROP POLICY IF EXISTS "Brokers can manage own deals" ON public.broker_deals;
CREATE POLICY "Brokers can manage own deals"
    ON public.broker_deals FOR ALL
    USING (broker_id = auth.uid());

-- 7. Tasks Policies
DROP POLICY IF EXISTS "Brokers can manage own tasks" ON public.broker_tasks;
CREATE POLICY "Brokers can manage own tasks"
    ON public.broker_tasks FOR ALL
    USING (broker_id = auth.uid());

-- =====================================================================
-- AUTOMATIC BROKER REGISTRATION TRIGGER
-- Auto-creates broker record when a user signs up via email/password or Google
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_broker()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.brokers (id, email, full_name, company_name, referral_code, aoc_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'company_name', '15D Executive Aviation Brokerage'),
        'BRK-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_broker();

-- =====================================================================
-- SEED DATA: VERIFIED AIRCRAFT & EMPTY LEGS
-- =====================================================================
INSERT INTO public.fleet_aircraft (tail_number, model, category, home_hub_icao, home_hub_name, pax_capacity, max_range_nm, cruise_speed_ktas, hourly_rate_usd, readiness_status, operator_name, aoc_number, is_verified_aoc)
VALUES
    ('5N-MAX', 'Bombardier Challenger 604', 'Heavy Jet', 'DNAA', 'Abuja Nnamdi Azikiwe', 12, 4000, 470, 6500.00, 'READY_NOW', 'Max Air Charter', 'AOC #MA-044', true),
    ('5N-BKI', 'Hawker 900XP', 'Midsize Jet', 'DNMM', 'Lagos Murtala Muhammed', 8, 2900, 483, 4800.00, 'READY_90M', 'Air Peace Executive', 'AOC #AP-2024', true),
    ('G-LUXX', 'Gulfstream G650ER', 'Ultra Long Range', 'EGGW', 'London Luton & Lagos Hub', 14, 7500, 516, 11200.00, 'AVAILABLE', 'Westminster Jets UK', 'AOC #UK-771', true),
    ('5N-PHN', 'Embraer Phenom 300', 'Light Jet', 'DNPO', 'Port Harcourt International', 7, 2010, 464, 3900.00, 'READY_NOW', 'ExecuJet West Africa', 'AOC #EJ-901', true),
    ('5N-XLS', 'Cessna Citation XLS+', 'Midsize Jet', 'DNKN', 'Kano Mallam Aminu', 9, 2100, 441, 4400.00, 'READY_NOW', 'Air Peace Executive', 'AOC #AP-2024', true)
ON CONFLICT (tail_number) DO NOTHING;

INSERT INTO public.empty_legs (origin_icao, origin_name, destination_icao, destination_name, departure_datetime, seats_available, discounted_price_usd, standard_price_usd, discount_pct, status)
VALUES
    ('DNMM', 'Lagos Murtala Muhammed', 'DNAA', 'Abuja Nnamdi Azikiwe', NOW() + INTERVAL '18 hours', 8, 9500.00, 16000.00, 41, 'AVAILABLE'),
    ('DNAA', 'Abuja Nnamdi Azikiwe', 'EGGW', 'London Luton Airport', NOW() + INTERVAL '36 hours', 12, 48000.00, 85000.00, 44, 'AVAILABLE'),
    ('DNPO', 'Port Harcourt Int.', 'DNMM', 'Lagos Murtala Muhammed', NOW() + INTERVAL '12 hours', 7, 6200.00, 11000.00, 44, 'FEW_SEATS')
ON CONFLICT DO NOTHING;
