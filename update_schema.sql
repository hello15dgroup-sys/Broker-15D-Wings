
-- Add Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferences JSONB,
    total_spend NUMERIC DEFAULT 0,
    last_flight DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Flight History Table
CREATE TABLE IF NOT EXISTS public.flight_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    route TEXT NOT NULL,
    aircraft TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers manage their own clients') THEN
        CREATE POLICY "Brokers manage their own clients" ON public.clients
            FOR ALL USING (broker_id IN (SELECT id FROM public.brokers WHERE auth_user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers manage their own flight history') THEN
        CREATE POLICY "Brokers manage their own flight history" ON public.flight_history
            FOR ALL USING (broker_id IN (SELECT id FROM public.brokers WHERE auth_user_id = auth.uid()));
    END IF;
END
$$;
