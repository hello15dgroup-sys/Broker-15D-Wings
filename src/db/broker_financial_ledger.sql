-- =================================================================
-- 15D WINGS BROKER REFERRAL & REVENUE SHARING ARCHITECTURE
-- =================================================================

-- 1. HARDEN MAIN PUBLIC.BROKERS TABLE WITH FINANCIAL LEDGER FIELDS
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS commission_tier TEXT DEFAULT 'STANDARD_10_PERCENT',
  ADD COLUMN IF NOT EXISTS lifetime_volume_usd NUMERIC(14,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_commission_earned_usd NUMERIC(14,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS pending_settlement_usd NUMERIC(14,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS active_referrals_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settlement_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payout_wallet_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS payout_bank_details JSONB NULL;

-- 2. BROKER COMMISSION LEDGER TABLE (AUDIT TRAIL PER MISSION)
-- Eliminates duplicate broker records and guarantees verifiable payout history
CREATE TABLE IF NOT EXISTS public.broker_commission_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id INT NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    gross_mission_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    platform_fee_collected NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    broker_commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1000, -- e.g. 0.1000 (10%)
    earned_commission_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    settlement_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SETTLED, CLAWBACK
    settled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_broker ON public.broker_commission_ledger(broker_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_mission ON public.broker_commission_ledger(mission_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_status ON public.broker_commission_ledger(settlement_status);


-- 3. AUTOMATED COMMISSION CALCULATION & LIFETIME VOLUME TRIGGER
-- Automatically credits the broker ledger when a mission transitions to 'CONFIRMED' or 'COMPLETED'
CREATE OR REPLACE FUNCTION public.process_broker_mission_commission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_broker_id INT;
  v_commission_rate NUMERIC(5,4) := 0.1000; -- Default 10% split of platform fee
  v_earned_amount NUMERIC(14,2);
  v_mission_value NUMERIC(14,2);
  v_platform_fee NUMERIC(14,2);
BEGIN
  -- Only process if mission is linked to a broker
  IF NEW.broker_id IS NOT NULL AND (NEW.status IN ('CONFIRMED', 'COMPLETED')) AND (OLD.status NOT IN ('CONFIRMED', 'COMPLETED')) THEN
    v_broker_id := NEW.broker_id;
    v_mission_value := COALESCE(NEW.midpoint_estimate, NEW.gross_operator_quote, 0.00);
    v_platform_fee := COALESCE(NEW.platform_fee, v_mission_value * 0.10);

    -- Calculate broker split (10% of platform fee or platform total profit share)
    v_earned_amount := v_platform_fee * v_commission_rate;

    -- 1. Insert Record into Audit Ledger
    INSERT INTO public.broker_commission_ledger (
      broker_id,
      mission_id,
      gross_mission_value,
      platform_fee_collected,
      broker_commission_rate,
      earned_commission_amount,
      settlement_status
    ) VALUES (
      v_broker_id,
      NEW.id,
      v_mission_value,
      v_platform_fee,
      v_commission_rate,
      v_earned_amount,
      'PENDING'
    )
    ON CONFLICT DO NOTHING;

    -- 2. Update Broker Totals Real-Time
    UPDATE public.brokers
    SET 
      lifetime_volume_usd = COALESCE(lifetime_volume_usd, 0) + v_mission_value,
      total_commission_earned_usd = COALESCE(total_commission_earned_usd, 0) + v_earned_amount,
      pending_settlement_usd = COALESCE(pending_settlement_usd, 0) + v_earned_amount,
      updated_at = NOW()
    WHERE id = v_broker_id;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_broker_commission ON public.missions;
CREATE TRIGGER trg_process_broker_commission
  AFTER UPDATE OF status ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.process_broker_mission_commission();
