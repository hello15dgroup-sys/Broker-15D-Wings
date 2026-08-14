-- ==============================================================================
-- 15D WINGS EXECUTIVE AVIATION PLATFORM
-- FULL PRODUCTION POSTGRESQL IDEMPOTENT DATABASE SCHEMA
-- Compatible with Supabase, Cloud SQL, AWS RDS, Neon, and Local PostgreSQL
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schema Helper: Idempotent updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. BROKERS TABLE
-- Manages Broker authentication, company identity, and AOC clearance status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS brokers (
    id SERIAL PRIMARY KEY,
    broker_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255) DEFAULT '15D Executive Aviation Brokerage',
    phone VARCHAR(50),
    device_fingerprint VARCHAR(255),
    agency_clearance_status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED_90_DAYS, DEACTIVATED
    is_soft_deleted BOOLEAN DEFAULT FALSE,
    has_verified_operator BOOLEAN DEFAULT FALSE,
    last_client_onboarded_at TIMESTAMP WITH TIME ZONE,
    last_flight_booked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brokers_email ON brokers(email);
CREATE INDEX IF NOT EXISTS idx_brokers_clearance ON brokers(agency_clearance_status);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_brokers_updated_at') THEN
        CREATE TRIGGER trg_brokers_updated_at BEFORE UPDATE ON brokers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==============================================================================
-- 4. OPERATORS & AOC REGISTRY
-- Manages licensed Air Operator Certificate holders, tail registries, and tiers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    operator_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    aoc_number VARCHAR(100) NOT NULL,
    operator_license VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Nigeria',
    tier VARCHAR(50) DEFAULT 'TIER_1_DIRECT', -- TIER_1_DIRECT, TIER_2_REPOSITIONING, TIER_3_ICC_DESK
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    active_aircraft_inventory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operators_aoc ON operators(aoc_number);
CREATE INDEX IF NOT EXISTS idx_operators_tier ON operators(tier);
CREATE INDEX IF NOT EXISTS idx_operators_broker ON operators(broker_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_operators_updated_at') THEN
        CREATE TRIGGER trg_operators_updated_at BEFORE UPDATE ON operators
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==============================================================================
-- 5. AIRCRAFT INVENTORY
-- Specific aircraft specifications, categories, rates, and multimedia tours
-- ==============================================================================
CREATE TABLE IF NOT EXISTS aircraft_inventory (
    id SERIAL PRIMARY KEY,
    aircraft_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
    tail_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- LIGHT JET, MIDSIZE JET, HEAVY JET, ULTRA LONG RANGE, VIP AIRLINER
    model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    year_of_manufacture INT,
    max_passengers INT NOT NULL DEFAULT 8,
    cruise_speed_ktas NUMERIC(10, 2) DEFAULT 450.00,
    range_nm NUMERIC(10, 2) DEFAULT 3200.00,
    hourly_rate_usd NUMERIC(12, 2) NOT NULL DEFAULT 4000.00,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    virtual_tour_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    current_location_icao VARCHAR(10) DEFAULT 'DNMM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aircraft_tail ON aircraft_inventory(tail_number);
CREATE INDEX IF NOT EXISTS idx_aircraft_category ON aircraft_inventory(category);
CREATE INDEX IF NOT EXISTS idx_aircraft_operator ON aircraft_inventory(operator_id);

-- ==============================================================================
-- 6. CLIENTS (HNWI & CORPORATE PROFILES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    passport_number VARCHAR(100),
    nationality VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, VIP_TIER_1, PENDING_KYC, INACTIVE
    preferences JSONB DEFAULT '{}'::jsonb,
    total_flights INT DEFAULT 0,
    total_spend_usd NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_broker ON clients(broker_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ==============================================================================
-- 7. MISSIONS & FLIGHTS (CORE CHARTER ENGINE)
-- Supports booking code generation, flight tracking, and financial handoffs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS missions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 15D-8941, 15D-001
    mission_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    departure_airport VARCHAR(20) NOT NULL,
    arrival_airport VARCHAR(20) NOT NULL,
    departure_date TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    aircraft_type VARCHAR(100),
    aircraft_class VARCHAR(50) DEFAULT 'HEAVY',
    operator_aircraft VARCHAR(100),
    trip_type VARCHAR(20) DEFAULT 'ONEWAY', -- ONEWAY, ROUND, MULTI_LEG
    passengers INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'INTAKE_SUBMITTED', -- INTAKE_SUBMITTED, ACCEPTED, OPERATOR_REVIEW, DEPOSIT_CONFIRMED, PRE_ACTIVATION, ACTIVATED, EXECUTING, DEPARTED, ARRIVED, COMPLETED, CANCELLED, ROTATING, ABORTED
    payment_status VARCHAR(50) DEFAULT 'AWAITING_PAYMENT', -- AWAITING_PAYMENT, AWAITING_VERIFICATION, CONFIRMING, CONFIRMED, REFUNDED
    estimated_lower NUMERIC(14, 2),
    estimated_upper NUMERIC(14, 2),
    midpoint_estimate NUMERIC(14, 2),
    total_estimate NUMERIC(14, 2),
    upfront_deposit NUMERIC(14, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0.00,
    escrow_deposit NUMERIC(14, 2) DEFAULT 0.00,
    platform_fee NUMERIC(14, 2) DEFAULT 0.00,
    gross_operator_quote NUMERIC(14, 2),
    broker_markup NUMERIC(14, 2) DEFAULT 0.00,
    execution_timestamp BIGINT,
    is_config_locked BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1,
    legs JSONB DEFAULT '[]'::jsonb,
    mission_customizations JSONB DEFAULT '{}'::jsonb,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    vip_payment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_payment_status ON missions(payment_status);
CREATE INDEX IF NOT EXISTS idx_missions_client_email ON missions(client_email);
CREATE INDEX IF NOT EXISTS idx_missions_broker ON missions(broker_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_missions_updated_at') THEN
        CREATE TRIGGER trg_missions_updated_at BEFORE UPDATE ON missions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 7b. Alias Flights Table (Fully synchronized with missions)
CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
    origin VARCHAR(20) NOT NULL,
    destination VARCHAR(20) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    aircraft_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'INQUIRY',
    total_estimate NUMERIC(14, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flights_booking_code ON flights(booking_code);

-- ==============================================================================
-- 8. PASSENGER MANIFEST TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS flight_passengers (
    id SERIAL PRIMARY KEY,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    passport_number VARCHAR(100),
    nationality VARCHAR(100),
    date_of_birth DATE,
    weight_kg NUMERIC(6, 2),
    dietary_preferences TEXT,
    medical_notes TEXT,
    emergency_contact VARCHAR(255),
    clearance_status VARCHAR(50) DEFAULT 'CLEARED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passengers_mission ON flight_passengers(mission_id);

-- ==============================================================================
-- 9. LEADS & BROKER CRM PIPELINE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS leads_pipeline (
    id SERIAL PRIMARY KEY,
    broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    deal_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    origin VARCHAR(20),
    destination VARCHAR(20),
    aircraft_category VARCHAR(100),
    estimated_value_usd NUMERIC(14, 2),
    broker_markup_percent NUMERIC(6, 2) DEFAULT 10.00,
    broker_commission_usd NUMERIC(14, 2) DEFAULT 0.00,
    stage VARCHAR(50) DEFAULT 'Inquiry', -- Inquiry, Quote Sent, Proposal Viewed, Contract Signed, Commission Settled
    notes TEXT,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_broker ON leads_pipeline(broker_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_leads_deal_code ON leads_pipeline(deal_code);

-- ==============================================================================
-- 10. PROPOSALS (WHITE-LABEL ENGINE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    proposal_code VARCHAR(50) NOT NULL UNIQUE,
    flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    theme_color VARCHAR(50) DEFAULT '#1877F2',
    font_family VARCHAR(50) DEFAULT 'Lexend',
    broker_markup_usd NUMERIC(14, 2) DEFAULT 0.00,
    baseline_wholesale_usd NUMERIC(14, 2) NOT NULL,
    client_total_usd NUMERIC(14, 2) NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    is_viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proposals_code ON proposals(proposal_code);
CREATE INDEX IF NOT EXISTS idx_proposals_broker ON proposals(broker_id);

-- ==============================================================================
-- 11. CONTRACTS & CHARTER AGREEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SENT, SIGNED, EXPIRED, CANCELLED
    terms_text TEXT,
    cancellation_rules JSONB DEFAULT '{}'::jsonb,
    signed_by_name VARCHAR(255),
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_ip VARCHAR(50),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_code ON contracts(contract_code);

-- ==============================================================================
-- 12. PAYMENTS & ESCROW SETTLEMENTS
-- Direct connection to VIP.15DWINGS.COM.NG activation and principal payments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    flight_id INT REFERENCES flights(id) ON DELETE SET NULL,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    booking_code VARCHAR(50),
    payment_reference VARCHAR(100) UNIQUE,
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_type VARCHAR(50) DEFAULT 'ACTIVATION_DEPOSIT', -- ACTIVATION_DEPOSIT, PRINCIPAL_PAYMENT, FINAL_BALANCE, CATERING_UPGRADE
    escrow_status VARCHAR(50) DEFAULT 'HOLD', -- HOLD, CLEARED, SETTLED, REFUNDED
    proof_of_payment_url TEXT,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_mission ON payments(mission_id);
CREATE INDEX IF NOT EXISTS idx_payments_escrow ON payments(escrow_status);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(payment_reference);

-- ==============================================================================
-- 13. FLIGHT LOGS & RADAR TELEMETRY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS flight_logs (
    id SERIAL PRIMARY KEY,
    flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    booking_code VARCHAR(50),
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
    origin VARCHAR(20) NOT NULL,
    destination VARCHAR(20) NOT NULL,
    aircraft_type VARCHAR(100),
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    flight_duration_hours NUMERIC(6, 2),
    passengers INT DEFAULT 1,
    estimated_cost_usd NUMERIC(14, 2),
    actual_cost_usd NUMERIC(14, 2),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    telemetry_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flight_logs_booking ON flight_logs(booking_code);

-- ==============================================================================
-- 14. EYE OF GOD TELEMETRY & DEVICE FINGERPRINTING LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS eye_of_god_logs (
    id SERIAL PRIMARY KEY,
    device_fingerprint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    departure_airport VARCHAR(20),
    arrival_airport VARCHAR(20),
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE SET NULL,
    search_query TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    linked_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eye_fingerprint ON eye_of_god_logs(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_eye_broker ON eye_of_god_logs(broker_id);

-- ==============================================================================
-- 15. TIMELINE AUDIT & NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS timeline_logs (
    id SERIAL PRIMARY KEY,
    flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- INTAKE_CREATED, PROPOSAL_VIEWED, CONTRACT_SENT, PAYMENT_CONFIRMED, RADAR_ACTIVATED
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) DEFAULT 'BROKER', -- BROKER, CLIENT, OPERATOR, ICC_ADMIN
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'SYSTEM', -- SYSTEM, ICC, CHAT, PAYMENT
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_email, read);

-- ==============================================================================
-- SCHEMA CREATION COMPLETE (IDEMPOTENT & PRODUCTION READY)
-- ==============================================================================
