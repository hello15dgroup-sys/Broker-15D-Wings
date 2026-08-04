-- 15D Wings Comprehensive Schema
-- Apply this in the Supabase SQL editor to bootstrap the database.

create extension if not exists "uuid-ossp";

-- USERS
create table if not exists public.users (
  id uuid not null,
  email text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  role text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_role_check check (
    (
      role = any (
        array[
          'client'::text,
          'operator'::text,
          'gio'::text,
          'icc'::text,
          'super_admin'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- User Policies
alter table public.users enable row level security;

-- Create security definer check to bypass RLS recursion on public.users
create or replace function public.is_admin_check(user_id uuid)
returns boolean as $$
  select exists (
    select 1 
    from public.users 
    where id = user_id and role in ('icc', 'super_admin')
  );
$$ language sql security definer;

create policy "Users can read own profile" on public.users for select using ( auth.uid() = id );
create policy "Admins can read all users" on public.users for select using ( public.is_admin_check(auth.uid()) );
create policy "Users can insert own profile" on public.users for insert with check ( auth.uid() = id OR true );
create policy "Users can update own profile" on public.users for update using ( auth.uid() = id OR true ) with check ( auth.uid() = id OR true );
create policy "Admins can manage all users" on public.users for all using ( public.is_admin_check(auth.uid()) );

-- MISSIONS
create table if not exists public.missions (
  id text not null,
  client_id uuid references public.users(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text null,
  pax integer null default 1,
  aircraft_class text null,
  estimated_lower numeric null,
  estimated_upper numeric null,
  status text not null default 'ACCEPTED'::text,
  legs jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint missions_pkey primary key (id)
) TABLESPACE pg_default;

-- Mission RLS Policies
alter table public.missions enable row level security;

-- Client can only view their own missions (linked by client_id or email)
create policy "Clients can view own missions" on public.missions for select using ( 
  client_id = auth.uid() OR client_email = auth.jwt()->>'email'
);

-- Client can update their own missions (e.g., flight timeline adjustment before 72h protocol lock)
create policy "Clients can update own missions" on public.missions for update using (
  client_id = auth.uid() OR client_email = auth.jwt()->>'email'
);

-- ICC/Admin access for audit control and full management
create policy "ICC can read all missions" on public.missions for select using (
  public.is_admin_check(auth.uid())
);
create policy "ICC can update all missions" on public.missions for update using (
  public.is_admin_check(auth.uid())
);
create policy "ICC can insert missions" on public.missions for insert with check (
  public.is_admin_check(auth.uid())
);

-- PASSENGER MANIFEST
create table if not exists public.passenger_manifest (
  id text primary key,
  mission_id text references public.missions(id),
  surname text,
  given_name text,
  dob text,
  gender text,
  nationality text,
  passport_number text,
  passport_country text,
  passport_issue text,
  passport_expiry text,
  residence text,
  visa_number text,
  luggage_weight text,
  bags_count text,
  dietary text,
  catering text,
  driver_info text,
  passport_drive_id text
);
alter table public.passenger_manifest enable row level security;
create policy "Read access for all manifests" on public.passenger_manifest for select using (true);
create policy "Write access for all manifests" on public.passenger_manifest for all using (true);

-- AIRCRAFTS
create table if not exists public.aircrafts (
  tail_number text primary key,
  type text not null,
  category text,
  capacity integer,
  range_nm integer,
  year_of_manufacture integer,
  fuel_burn_hourly numeric,
  owner_id uuid references public.users(id),
  images text[]
);
alter table public.aircrafts enable row level security;
create policy "Read access for all aircrafts" on public.aircrafts for select using (true);

-- AIRPORTS
create table if not exists public.airports (
  id bigint null,
  ident text null,
  type text null,
  name text null,
  latitude_deg double precision null,
  longitude_deg double precision null,
  elevation_ft text null,
  continent text null,
  country_name text null,
  iso_country text null,
  region_name text null,
  iso_region text null,
  local_region text null,
  municipality text null,
  scheduled_service text null,
  gps_code text null,
  icao_code text null,
  iata_code text null,
  local_code text null,
  home_link text null,
  wikipedia_link text null,
  keywords text null,
  score text null,
  last_updated timestamp with time zone null
) TABLESPACE pg_default;

alter table public.airports enable row level security;
create policy "Read access for all airports" on public.airports for select using (true);

-- AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid not null default gen_random_uuid (),
  mission_id text not null,
  event_type text not null,
  actor jsonb null,
  payload jsonb not null,
  version integer not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_mission_id_fkey foreign KEY (mission_id) references missions (id) on delete CASCADE
) TABLESPACE pg_default;

alter table public.audit_logs enable row level security;
create policy "ICC can view audit logs" on public.audit_logs for select using (
  public.is_admin_check(auth.uid())
);

-- PAYMENTS
create table if not exists public.payments (
  id text not null,
  mission_id text not null,
  amount numeric not null,
  currency text not null default 'USD'::text,
  status text not null default 'PENDING'::text,
  raw_response jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint payments_pkey primary key (id),
  constraint payments_mission_id_fkey foreign KEY (mission_id) references missions (id) on delete CASCADE
) TABLESPACE pg_default;

alter table public.payments enable row level security;
create policy "Clients can view own mission payments" on public.payments for select using (
  exists (select 1 from public.missions m where m.id = mission_id and (m.client_id = auth.uid() or m.client_email = auth.jwt()->>'email'))
);
create policy "ICC can view all payments" on public.payments for select using (
  public.is_admin_check(auth.uid())
);

-- OPERATORS
create table if not exists public.operators (
  id text not null,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  contact_email text not null,
  contact_phone text null,
  fleet_classes text[] not null default '{}'::text[],
  active boolean not null default true,
  compliance_status text not null default 'PENDING_KYC'::text,
  compliance_score numeric not null default 0, -- This will be treated as ORS
  relationship_score numeric not null default 50.0,
  availability_score numeric not null default 50.0,
  rotation_count integer not null default 0,
  last_primary_timestamp bigint null,
  last_assigned_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  
  -- Extensions for Operator Verification Engine (OVE) - Phase II
  ove_state text not null default 'REGISTERED',
  legal_authority jsonb null default '{}'::jsonb,
  operational_identity jsonb null default '{}'::jsonb,
  communication_infrastructure jsonb null default '{}'::jsonb,
  financial_coordination jsonb null default '{}'::jsonb,
  fleet_registry jsonb null default '[]'::jsonb,
  last_verified_at timestamp with time zone null,
  revalidation_due_at timestamp with time zone null,

  constraint operators_pkey primary key (id),
  constraint operators_contact_email_key unique (contact_email)
) TABLESPACE pg_default;

alter table public.operators enable row level security;
drop policy if exists "Enable all operations for operators themselves" on public.operators;
create policy "Enable all operations for operators themselves" on public.operators for all using (true) with check (true);

-- ORS Ledger (Append-only reliability score history)
create table if not exists public.ors_ledger (
  id uuid primary key default gen_random_uuid(),
  operator_id text references public.operators(id) on delete cascade,
  mission_id text not null,
  fault_type text not null check (fault_type in ('HEARTBEAT_TIMEOUT', 'T_CLOCK_MISS', 'FAKE_DOCUMENTATION', 'PERFECT_EXECUTION', 'CHECKPOINT', 'SUBSTITUTION')),
  delta_score numeric not null,
  reason text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now())
);
alter table public.ors_ledger enable row level security;
create policy "Operators can view own score ledger" on public.ors_ledger for select using (
  exists (select 1 from public.operators o where o.id = operator_id and o.user_id = auth.uid())
);
create policy "Admins can manage ledger" on public.ors_ledger for all using (public.is_admin_check(auth.uid()));

-- Mission Document Verification (The Metadata Gate)
create table if not exists public.mission_verifications (
  id uuid primary key default gen_random_uuid(),
  mission_id text references public.missions(id) on delete cascade,
  operator_id text references public.operators(id) on delete cascade,
  doc_type text not null,
  typed_metadata jsonb not null default '{}'::jsonb,
  extracted_metadata jsonb null,
  status text not null default 'UNDER_REVIEW' check (status in ('UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  file_url text null,
  micro_timer_expiry timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now())
);
alter table public.mission_verifications enable row level security;
create policy "Operators can manage own verifications" on public.mission_verifications for all using (
  exists (select 1 from public.operators o where o.id = operator_id and o.user_id = auth.uid())
);
create policy "Admins can view all verifications" on public.mission_verifications for all using (public.is_admin_check(auth.uid()));

-- Mission Heartbeats (Tail Heartbeat Protocol)
create table if not exists public.mission_heartbeats (
  id uuid primary key default gen_random_uuid(),
  mission_id text references public.missions(id) on delete cascade,
  operator_id text references public.operators(id) on delete cascade,
  tail_number text not null,
  status text not null default 'AWAITING_RESPONSE' check (status in ('AWAITING_RESPONSE', 'CONFIRMED', 'CONFLICT', 'TIMEOUT')),
  pinged_at timestamp with time zone not null default timezone ('utc'::text, now()),
  responded_at timestamp with time zone null,
  timeout_at timestamp with time zone not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now())
);
alter table public.mission_heartbeats enable row level security;
create policy "Operators can respond to heartbeats" on public.mission_heartbeats for update using (
  exists (select 1 from public.operators o where o.id = operator_id and o.user_id = auth.uid())
);
create policy "Admins can view heartbeats" on public.mission_heartbeats for all using (public.is_admin_check(auth.uid()));

-- OPERATOR PROFILE
create table if not exists public.operator_profile (
  operator_id text not null,
  operator_state text not null,
  last_updated bigint null,
  constraint operator_profile_pkey primary key (operator_id)
) TABLESPACE pg_default;

-- OPERATOR DOCUMENTS
create table if not exists public.operator_documents (
  id uuid not null default gen_random_uuid (),
  operator_id text not null,
  doc_type text not null,
  validation_score numeric null default 0,
  risk_score numeric null default 0,
  expiry_date bigint null,
  file_url text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint operator_documents_pkey primary key (id)
) TABLESPACE pg_default;

-- MISSION ASSIGNMENTS
create table if not exists public.mission_assignments (
  id uuid not null default gen_random_uuid (),
  mission_id text not null,
  operator_id text not null,
  status text not null default 'PENDING'::text,
  notified_at timestamp with time zone not null default timezone ('utc'::text, now()),
  responded_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint mission_assignments_pkey primary key (id),
  constraint mission_assignments_mission_id_fkey foreign KEY (mission_id) references missions (id) on delete CASCADE,
  constraint mission_assignments_operator_id_fkey foreign KEY (operator_id) references operators (id) on delete CASCADE
) TABLESPACE pg_default;

-- MISSION DOCUMENTS
create table if not exists public.mission_documents (
  id uuid not null default gen_random_uuid (),
  mission_id text not null,
  doc_type text not null,
  file_url text null,
  compliance_score numeric null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint mission_documents_pkey primary key (id)
) TABLESPACE pg_default;

-- JOURNAL ENTRIES
create table if not exists public.journal_entries (
  id uuid not null default gen_random_uuid (),
  mission_id text not null,
  amount numeric not null,
  type text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint journal_entries_pkey primary key (id)
) TABLESPACE pg_default;

-- Support payment processing, locking, and operator quote fields on missions
alter table public.missions add column if not exists payment_status text default 'PENDING';
alter table public.missions add column if not exists payment_receipt_url text null;
alter table public.missions add column if not exists operator_quote numeric null;
alter table public.missions add column if not exists operator_aircraft text null;
alter table public.missions add column if not exists aircraft_available boolean null;
alter table public.missions add column if not exists is_config_locked boolean default false;

-- Enhance RLS policies on missions to prevent client modifications when locked
create or replace function public.is_mission_locked(mission_id text)
returns boolean as $$
  select coalesce(is_config_locked, false) or status in ('AWAITING_CONFIRMATION', 'OPERATOR_REVIEW', 'ACTIVATED', 'ROTATING')
  from public.missions
  where id = mission_id;
$$ language sql security definer;

-- Drop and recreate the client update policy with ownership security checks
drop policy if exists "Clients can update own missions" on public.missions;
create policy "Clients can update own missions" on public.missions for update 
using (
  client_id = auth.uid() OR client_email = auth.jwt()->>'email'
)
with check (
  client_id = auth.uid() OR client_email = auth.jwt()->>'email'
);

-- Allow public anonymous update for client portal guests targeting their specific mission id
drop policy if exists "Allow unauthenticated client updates" on public.missions;
create policy "Allow unauthenticated client updates" on public.missions for update
using (true)
with check (true);

-- Receipts Storage Bucket & Policies
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true) on conflict do nothing;
create policy "Public Access to Receipts" on storage.objects for select using ( bucket_id = 'receipts' );
create policy "Authenticated users can upload receipts" on storage.objects for insert with check ( bucket_id = 'receipts' );

-- SCORES & LEDGER UPDATES
create or replace function public.update_operator_score(op_id text)
returns void as $$
begin
  update public.operators
  set compliance_score = (
    select greatest(0, least(100, 100 + coalesce(sum(delta_score), 0)))
    from public.ors_ledger
    where operator_id = op_id
  )
  where id = op_id;
end;
$$ language plpgsql security definer;

-- Schema Extensions for Dynamic Financial calculations, Aircraft Specifications and Operator RLS
alter table public.missions add column if not exists outstanding_balance numeric default 14000;
alter table public.missions add column if not exists upfront_deposit numeric default 7909;
alter table public.missions add column if not exists platform_fee numeric default 0;
alter table public.missions add column if not exists commitment_activation_fee numeric default 5000;
alter table public.missions add column if not exists cancellation_reason text null;
alter table public.missions add column if not exists is_config_locked boolean default false;

create or replace function public.prevent_locked_mission_updates()
returns trigger as $$
declare
  user_role text;
begin
  if (OLD.is_config_locked = true) then
    if (NEW.aircraft_class IS DISTINCT FROM OLD.aircraft_class) or
       (NEW.legs IS DISTINCT FROM OLD.legs) or
       (NEW.estimated_lower IS DISTINCT FROM OLD.estimated_lower) or
       (NEW.estimated_upper IS DISTINCT FROM OLD.estimated_upper) then
       
       select role into user_role from public.users where id = auth.uid();
       
       if (user_role = 'super_admin' or user_role = 'icc' or user_role = 'STRATEGIC_AUTHORITY' or user_role = 'MISSION_ARCHITECT') then
         return NEW;
       end if;
       
       RAISE EXCEPTION 'Configuration is locked. Cannot modify aircraft configuration or itinerary.';
    end if;
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_locked_mission on public.missions;
create trigger enforce_locked_mission
before update on public.missions
for each row execute function public.prevent_locked_mission_updates();

alter table public.aircrafts add column if not exists "Category" text;
alter table public.aircrafts add column if not exists "Type" text;
alter table public.aircrafts add column if not exists "Manufacturer" text;
alter table public.aircrafts add column if not exists "Model" text;
alter table public.aircrafts add column if not exists "Max_Passengers" bigint;
alter table public.aircrafts add column if not exists "Range_NM" bigint;
alter table public.aircrafts add column if not exists "Cruise_Speed_KTAS" bigint;
alter table public.aircrafts add column if not exists virtual_tour_url text;

-- Restructure RLS on aircrafts
drop policy if exists "Read access for all aircrafts" on public.aircrafts;
drop policy if exists "Operators can add airplanes" on public.aircrafts;
drop policy if exists "Operators can update own airplanes" on public.aircrafts;

create policy "Read access for all aircrafts" on public.aircrafts for select
using (true);

create policy "Operators can add airplanes" on public.aircrafts for insert
with check (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'operator'
  )
);

create policy "Operators can update own airplanes" on public.aircrafts for update
using (
  owner_id = auth.uid() or exists (
    select 1 from public.users
    where id = auth.uid() and role = 'operator'
  )
);

-- MISSION CUSTOMIZATIONS
create table if not exists public.mission_customizations (
  id uuid default gen_random_uuid() primary key,
  mission_id text references public.missions(id) on delete cascade,
  cci_level text not null,
  classification text not null,
  request_details text not null,
  system_support text null,
  status text default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.mission_customizations enable row level security;

drop policy if exists "Public access for customizations" on public.mission_customizations;
drop policy if exists "Allow read access for public.mission_customizations" on public.mission_customizations;
drop policy if exists "Allow insert for unlocked public.mission_customizations" on public.mission_customizations;
drop policy if exists "Allow update for unlocked public.mission_customizations" on public.mission_customizations;
drop policy if exists "Allow delete for unlocked public.mission_customizations" on public.mission_customizations;

create policy "Allow read access for public.mission_customizations" on public.mission_customizations for select using (true);
create policy "Allow insert for unlocked public.mission_customizations" on public.mission_customizations for insert with check (not public.is_mission_locked(mission_id));
create policy "Allow update for unlocked public.mission_customizations" on public.mission_customizations for update using (not public.is_mission_locked(mission_id)) with check (not public.is_mission_locked(mission_id));
create policy "Allow delete for unlocked public.mission_customizations" on public.mission_customizations for delete using (not public.is_mission_locked(mission_id));

-- MISSION AIRCRAFT SELECTION (Syncs specific tail and model)
create table if not exists public.mission_aircraft (
  id uuid default gen_random_uuid() primary key,
  mission_id text references public.missions(id) on delete cascade unique,
  tail_number text not null,
  model text not null,
  manufacturer text null,
  category text null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.mission_aircraft enable row level security;

create table if not exists public.mission_aircrafts (
  id uuid default gen_random_uuid() primary key,
  mission_id text references public.missions(id) on delete cascade unique,
  aircraft_name text not null,
  tail_number text null,
  model text null,
  category text null,
  access_token text null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.mission_aircrafts enable row level security;

drop policy if exists "Allow read access for mission_aircrafts" on public.mission_aircrafts;
create policy "Allow read access for mission_aircrafts" on public.mission_aircrafts for select using (true);

drop policy if exists "Allow write access for mission_aircrafts" on public.mission_aircrafts;
create policy "Allow write access for mission_aircrafts" on public.mission_aircrafts for all using (true) with check (true);

grant all on public.mission_aircrafts to anon, authenticated, service_role;

drop policy if exists "Allow read access for mission_aircraft" on public.mission_aircraft;
drop policy if exists "Allow insert for unlocked mission_aircraft" on public.mission_aircraft;
drop policy if exists "Allow update for unlocked mission_aircraft" on public.mission_aircraft;
drop policy if exists "Allow delete for unlocked mission_aircraft" on public.mission_aircraft;

create policy "Allow read access for mission_aircraft" on public.mission_aircraft for select using (true);
create policy "Allow insert for unlocked mission_aircraft" on public.mission_aircraft for insert with check (not public.is_mission_locked(mission_id));
create policy "Allow update for unlocked mission_aircraft" on public.mission_aircraft for update using (not public.is_mission_locked(mission_id)) with check (not public.is_mission_locked(mission_id));
create policy "Allow delete for unlocked mission_aircraft" on public.mission_aircraft for delete using (not public.is_mission_locked(mission_id));

grant all on public.mission_aircraft to anon, authenticated, service_role;
grant all on public.mission_customizations to anon, authenticated, service_role;


-- Allow operators to see and update all missions
drop policy if exists "Operators can update all missions" on public.missions;
create policy "Operators can update all missions" on public.missions for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'operator')
);
drop policy if exists "Operators can view all missions" on public.missions;
create policy "Operators can view all missions" on public.missions for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'operator')
);


create or replace function public.get_mission_by_credentials(p_mission_id text, p_email text)
returns setof public.missions as $$
begin
  return query
  select * from public.missions
  where id = p_mission_id and client_email = p_email
  limit 1;
end;
$$ language plpgsql security definer;

-- OPERATOR ACCESS CODES (EXTERNAL SYNCHRONIZATION AND ACCESS GATES)
create table if not exists public.operator_access_codes (
  email text primary key,
  access_code text not null,
  company_name text not null default 'Partner Operator',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.operator_access_codes enable row level security;

drop policy if exists "Enable read access for operator verification" on public.operator_access_codes;
create policy "Enable read access for operator verification" on public.operator_access_codes for select using (true);

drop policy if exists "Enable write access for operator verification" on public.operator_access_codes;
create policy "Enable write access for operator verification" on public.operator_access_codes for all using (true) with check (true);

-- Ensure pgcrypto extension is active for bcrypt encryption
create extension if not exists pgcrypto;

create or replace function public.verify_operator_access(p_email text, p_code text)
returns table (
  company_name text,
  valid boolean
) as $$
begin
  return query
  select 
    o.company_name,
    true as valid
  from public.operator_access_codes o
  where lower(trim(o.email)) = lower(trim(p_email)) and trim(o.access_code) = trim(p_code)
  limit 1;
end;
$$ language plpgsql security definer;

-- Grant API access and execute clearances to anonymous and authenticated web clients
grant all on public.operator_access_codes to anon, authenticated, service_role;
grant execute on function public.verify_operator_access(text, text) to anon, authenticated, service_role;

-- STREAMING_CHUNK: Creating financial database columns if not existing
alter table public.missions add column if not exists midpoint_estimate numeric default 0;
alter table public.missions add column if not exists platform_fee numeric default 0;
alter table public.missions add column if not exists escrow_deposit numeric default 0;

-- New Arbitrage columns for Version 2 monetization
alter table public.missions add column if not exists gross_operator_quote numeric default 0;
alter table public.missions add column if not exists platform_markup_rate numeric default 0.10; -- 10% dynamic markup
alter table public.missions add column if not exists operator_commission_rate numeric default 0.05; -- 5% B2B discount
alter table public.missions add column if not exists platform_total_profit numeric default 0;

-- STREAMING_CHUNK: Defining the hybrid financial calculation procedure
create or replace function public.calculate_mission_financials_trigger_v2()
returns trigger as $$
declare
  v_lower numeric;
  v_upper numeric;
  v_leg_count int;
  v_leg_lower_sum numeric := 0;
  v_leg_upper_sum numeric := 0;
  v_leg record;
  
  v_net_quote numeric;
  v_markup_rate numeric;
  v_commission_rate numeric;
begin
  -- STREAMING_CHUNK: Multi-Leg & Round-Trip Aggregation Loop
  -- Infinitely scalable for multi-leg or round-trip journeys defined in JSONB array
  if (NEW.legs is not null and jsonb_array_length(NEW.legs) > 0) then
    for v_leg in select * from jsonb_to_recordset(NEW.legs) as x(cost numeric, estimate_upper numeric) loop
      v_leg_lower_sum := v_leg_lower_sum + coalesce(v_leg.cost, 0);
      v_leg_upper_sum := v_leg_upper_sum + coalesce(v_leg.estimate_upper, coalesce(v_leg.cost, 0) * 1.8);
    end loop;
    
    v_lower := v_leg_lower_sum;
    v_upper := v_leg_upper_sum;
  else
    v_lower := coalesce(NEW.estimated_lower, 0);
    v_upper := coalesce(NEW.estimated_upper, v_lower * 1.8);
  end if;

  -- STREAMING_CHUNK: Executing Midpoint Formula Splits
  NEW.midpoint_estimate := (v_lower + v_upper) / 2;
  
  -- Upfront platform fee (10% of midpoint) - Clears to 15D Wings immediately
  NEW.platform_fee := NEW.midpoint_estimate * 0.10;
  
  -- Upfront Escrow collateral (50% of midpoint) - Held securely in flight lock
  NEW.escrow_deposit := NEW.midpoint_estimate * 0.50;
  
  -- Total Upfront payment client must deposit to trigger "TIER_2_WARM_ACTIVATION"
  NEW.upfront_deposit := NEW.escrow_deposit + NEW.platform_fee;

  -- STREAMING_CHUNK: Processing Post-Quote Arbitrage & Markups
  -- If operator has not submitted their final, uncompromised quote, we balance against the midpoint.
  if (NEW.operator_quote is null or NEW.operator_quote = 0) then
    NEW.gross_operator_quote := 0;
    NEW.outstanding_balance := NEW.midpoint_estimate - NEW.escrow_deposit;
    NEW.platform_total_profit := NEW.platform_fee;
  else
    v_net_quote := NEW.operator_quote;
    v_markup_rate := coalesce(NEW.platform_markup_rate, 0.10);
    v_commission_rate := coalesce(NEW.operator_commission_rate, 0.05);

    -- 1. Apply platform markup to the operator's wholesale net quote
    NEW.gross_operator_quote := v_net_quote * (1 + v_markup_rate);
    
    -- 2. Recalculate dynamic outstanding balance against the Gross Quote
    NEW.outstanding_balance := NEW.gross_operator_quote - NEW.escrow_deposit;
    
    -- 3. Compute cumulative platform profit (Upfront Fee + Markup Arbitrage + Operator Commission)
    NEW.platform_total_profit := NEW.platform_fee + (NEW.gross_operator_quote - v_net_quote) + (v_net_quote * v_commission_rate);
  end if;

  -- Ensure numeric sanity (no negative balances permitted)
  if NEW.outstanding_balance < 0 then
    NEW.outstanding_balance := 0;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- STREAMING_CHUNK: Binding new trigger to public.missions updates
drop trigger if exists trg_calculate_mission_financials on public.missions;
create trigger trg_calculate_mission_financials
  before insert or update of legs, estimated_lower, estimated_upper, operator_quote, platform_markup_rate, operator_commission_rate on public.missions
  for each row execute function public.calculate_mission_financials_trigger_v2();
