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
