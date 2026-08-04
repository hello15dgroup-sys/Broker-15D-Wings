CREATE TABLE IF NOT EXISTS mission_tasks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    task_name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mission_id, task_name)
);

CREATE TABLE IF NOT EXISTS mission_chats (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL,
    sender_id TEXT,
    message TEXT NOT NULL,
    visibility TEXT[] DEFAULT '{ICC, GIO}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_verifications (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL,
    status TEXT NOT NULL,
    confirmed_by TEXT NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Ensure GIO applicants has a phone column for reachability
ALTER TABLE public.gio_applicants ADD COLUMN IF NOT EXISTS phone TEXT;
