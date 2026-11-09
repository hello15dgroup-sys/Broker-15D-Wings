-- ==============================================================================
-- 18. BROKER REFERRAL & REVENUE SHARING TABLE (public.brokers_ref)
-- Manages broker referral hierarchy, commission yields, and settlement tracking
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brokers_ref (
    id SERIAL PRIMARY KEY,
    broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
    broker_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    agency_name VARCHAR(255) DEFAULT '15D Wings for Brokers',
    commission_tier VARCHAR(50) DEFAULT 'STANDARD_10_PERCENT',
    lifetime_volume_usd NUMERIC(14, 2) DEFAULT 0.00,
    total_commission_earned_usd NUMERIC(14, 2) DEFAULT 0.00,
    active_referrals_count INT DEFAULT 0,
    settlement_currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brokers_ref_code ON public.brokers_ref(referral_code);
CREATE INDEX IF NOT EXISTS idx_brokers_ref_email ON public.brokers_ref(email);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_brokers_ref_updated_at') THEN
        CREATE TRIGGER trg_brokers_ref_updated_at BEFORE UPDATE ON public.brokers_ref
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
