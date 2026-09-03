-- Idempotent SQL Setup for 15D Wings Broker App (Supabase / Postgres)

-- 1. Enable UUID Extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Brokers Table
CREATE TABLE IF NOT EXISTS public.brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    trial_used BOOLEAN DEFAULT false,
    referral_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure a broker can only have one profile linked to their auth user
CREATE UNIQUE INDEX IF NOT EXISTS brokers_auth_user_id_idx ON public.brokers (auth_user_id);

-- 3. Create Operators Table (Includes Telemetry / Onboarding Link Tracking)
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    onboarded_by_broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Proposals Table (CRM / Pricing Engine)
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_name TEXT,
    flight_details JSONB,
    total_price NUMERIC,
    status TEXT DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Set up Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Brokers can read and update their own profile
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers can view own profile') THEN
        CREATE POLICY "Brokers can view own profile" ON public.brokers
            FOR SELECT USING (auth.uid() = auth_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers can update own profile') THEN
        CREATE POLICY "Brokers can update own profile" ON public.brokers
            FOR UPDATE USING (auth.uid() = auth_user_id);
    END IF;
END
$$;

-- Brokers can see operators they onboarded
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers can view operators they onboarded') THEN
        CREATE POLICY "Brokers can view operators they onboarded" ON public.operators
            FOR SELECT USING (
                onboarded_by_broker_id IN (SELECT id FROM public.brokers WHERE auth_user_id = auth.uid())
            );
    END IF;
END
$$;

-- Brokers can CRUD their own proposals
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers manage their own proposals') THEN
        CREATE POLICY "Brokers manage their own proposals" ON public.proposals
            FOR ALL USING (
                broker_id IN (SELECT id FROM public.brokers WHERE auth_user_id = auth.uid())
            );
    END IF;
END
$$;


-- 6. Setup Storage Buckets (for documents/assets)
-- NOTE: In Supabase, bucket creation can also be done via the UI. 
-- Doing it via SQL requires inserting into the storage.buckets table.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('broker_documents', 'broker_documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('operator_assets', 'operator_assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Requires Supabase Storage extensions, safe idempotent policies)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers can upload documents') THEN
        CREATE POLICY "Brokers can upload documents" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'broker_documents' AND auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers can view own documents') THEN
        CREATE POLICY "Brokers can view own documents" ON storage.objects
            FOR SELECT USING (bucket_id = 'broker_documents' AND auth.role() = 'authenticated');
    END IF;
END
$$;

-- 7. Trigger to automatically create Broker record on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate a random referral code for telemetry
  new_referral_code := 'REF-' || upper(substr(md5(random()::text), 1, 6));

  INSERT INTO public.brokers (auth_user_id, email, referral_code)
  VALUES (new.id, new.email, new_referral_code)
  ON CONFLICT DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'Task',
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brokers manage their own tasks') THEN
        CREATE POLICY "Brokers manage their own tasks" ON public.tasks
            FOR ALL USING (broker_id IN (SELECT id FROM public.brokers WHERE auth_user_id = auth.uid()));
    END IF;
END
$$;

-- 2. Automations (Triggers)
-- Trigger: New Client -> Welcome Call Task
CREATE OR REPLACE FUNCTION public.trigger_new_client_task() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tasks (broker_id, title, description, type, due_date)
  VALUES (NEW.broker_id, 'Welcome Call: ' || NEW.name, 'Initial consultation and onboarding for new client.', 'Call', NOW() + INTERVAL '1 day');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_client_created ON public.clients;
CREATE TRIGGER on_client_created
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.trigger_new_client_task();


-- Trigger: New Proposal -> Follow-up Task
CREATE OR REPLACE FUNCTION public.trigger_new_proposal_task() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tasks (broker_id, title, description, type, due_date)
  VALUES (NEW.broker_id, 'Follow up on Quote: ' || COALESCE(NEW.client_name, 'Unknown Client'), 'Reach out to client to discuss the sent proposal.', 'Follow-up', NOW() + INTERVAL '2 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_proposal_created ON public.proposals;
CREATE TRIGGER on_proposal_created
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.trigger_new_proposal_task();
