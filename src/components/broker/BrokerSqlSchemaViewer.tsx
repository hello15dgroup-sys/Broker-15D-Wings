import React, { useState } from 'react';
import { Database, Copy, Check, ShieldCheck, Key, Server, Users, Plane, Lock } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';

export const BROKER_SUITE_SQL_CODE = `-- =====================================================================
-- 15D WINGS BROKER SUITE — PRODUCTION SQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Single Source of Truth for Fleet Availability, Broker CRM, Team & Missions
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BROKER PROFILES TABLE (Linked to Supabase Auth)
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

-- 2. BROKERAGE TEAM SUB-ACCOUNTS (Team Members & Junior Brokers)
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

-- 3. FLEET AIRCRAFT AVAILABILITY (Live Network Jets)
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

-- 4. EMPTY LEGS (Discounted Repositioning Flights)
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

-- 5. HNWI CLIENTS DIRECTORY
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

-- 6. BROKER CHARTER SALES PIPELINE & DEALS
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

-- 7. ACTIVE FLIGHT MISSIONS (EXACT PRODUCTION SCHEMA)
CREATE TABLE IF NOT EXISTS public.missions (
  id TEXT NOT NULL PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NULL,
  pax INTEGER NULL DEFAULT 1,
  aircraft_class TEXT NULL,
  estimated_lower NUMERIC NULL,
  estimated_upper NUMERIC NULL,
  status TEXT NOT NULL DEFAULT 'ACCEPTED',
  legs JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id UUID NULL,
  payment_status TEXT NULL DEFAULT 'PENDING',
  payment_receipt_url TEXT NULL,
  operator_quote NUMERIC NULL,
  aircraft_available BOOLEAN NULL,
  is_config_locked BOOLEAN NULL DEFAULT FALSE,
  outstanding_balance NUMERIC NULL DEFAULT 0,
  upfront_deposit NUMERIC NULL DEFAULT 0,
  operator_aircraft TEXT NULL,
  access_token UUID NULL DEFAULT gen_random_uuid (),
  midpoint_estimate NUMERIC NULL DEFAULT 0,
  platform_fee NUMERIC NULL DEFAULT 0,
  escrow_deposit NUMERIC NULL DEFAULT 0,
  gross_operator_quote NUMERIC NULL DEFAULT 0,
  platform_markup_rate NUMERIC NULL DEFAULT 0.10,
  operator_commission_rate NUMERIC NULL DEFAULT 0.05,
  platform_total_profit NUMERIC NULL DEFAULT 0,
  departure_airport TEXT NULL,
  destination_airport TEXT NULL,
  adults INTEGER NULL DEFAULT 1,
  children INTEGER NULL DEFAULT 0,
  infants INTEGER NULL DEFAULT 0,
  has_pets BOOLEAN NULL DEFAULT FALSE,
  pet_details TEXT NULL DEFAULT 'None',
  pet_weight_kg NUMERIC(6, 2) NULL DEFAULT 0.00,
  luggage_info TEXT NULL DEFAULT 'Standard',
  catering_preference TEXT NULL DEFAULT 'STANDARD',
  hazmat_declaration TEXT NULL DEFAULT 'NONE',
  medical_assistance TEXT NULL DEFAULT 'NO',
  total_tech_stops INTEGER NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_missions_client_email ON public.missions USING btree (client_email);
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON public.missions USING btree (created_at DESC);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empty_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Missions: Authenticated brokers can view missions
DROP POLICY IF EXISTS "Authenticated brokers can view missions" ON public.missions;
CREATE POLICY "Authenticated brokers can view missions"
    ON public.missions FOR SELECT
    USING (true);
`;

export const BrokerSqlSchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(BROKER_SUITE_SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Database className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-purple-900">
              Single Source of Truth Database Schema
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">
            PostgreSQL & Database Schema
          </h3>
          <p className="text-sm text-slate-600 font-normal">
            Ready-to-run DDL migrations for Active Missions, Fleet Availability, Broker Teams, and Row Level Security.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer self-start md:self-auto"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard' : 'Copy Complete SQL'}</span>
        </button>
      </div>

      {/* High-Level Architecture Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Active Missions</span>
          </div>
          <p className="text-[11px] text-slate-500">Flight mission schema</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
            <Plane className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fleet & Empty Legs</span>
          </div>
          <p className="text-[11px] text-slate-500">2 Tables • Global availability</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Row Level Security</span>
          </div>
          <p className="text-[11px] text-slate-500">Strict tenant isolation</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
            <Server className="w-3.5 h-3.5 text-amber-600" />
            <span>Auth Integration</span>
          </div>
          <p className="text-[11px] text-slate-500">Direct SQL authentication</p>
        </div>
      </div>

      {/* SQL Code Block */}
      <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-5 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner max-h-[500px] overflow-y-auto leading-relaxed">
        <pre>{BROKER_SUITE_SQL_CODE}</pre>
      </div>
    </div>
  );
};
