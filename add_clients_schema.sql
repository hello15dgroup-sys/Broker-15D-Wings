CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferences JSONB,
    total_spend NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers manage their own clients') THEN
        CREATE POLICY "Brokers manage their own clients" ON public.clients
            FOR ALL USING (broker_id IN (SELECT id FROM public.brokers WHERE auth_user_id = auth.uid()));
    END IF;
END
$$;
