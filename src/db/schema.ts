import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb, uuid } from "drizzle-orm/pg-core";

export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  broker_uuid: uuid("broker_uuid").defaultRandom().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  agency_name: varchar("agency_name", { length: 255 }).default('15D Executive Aviation Brokerage'),
  phone: varchar("phone", { length: 50 }),
  device_fingerprint: varchar("device_fingerprint", { length: 255 }),
  agency_clearance_status: varchar("agency_clearance_status", { length: 50 }).default('ACTIVE'), // ACTIVE, SUSPENDED_90_DAYS, DEACTIVATED
  is_soft_deleted: boolean("is_soft_deleted").default(false),
  has_verified_operator: boolean("has_verified_operator").default(false),
  last_client_onboarded_at: timestamp("last_client_onboarded_at"),
  last_flight_booked_at: timestamp("last_flight_booked_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  operator_uuid: uuid("operator_uuid").defaultRandom().unique(),
  broker_id: integer("broker_id").references(() => brokers.id),
  company_name: varchar("company_name", { length: 255 }).notNull(),
  aoc_number: varchar("aoc_number", { length: 100 }).notNull(),
  operator_license: varchar("operator_license", { length: 100 }),
  contact_email: varchar("contact_email", { length: 255 }),
  contact_phone: varchar("contact_phone", { length: 50 }),
  country: varchar("country", { length: 100 }).default('Nigeria'),
  tier: varchar("tier", { length: 50 }).default('TIER_1_DIRECT'), // TIER_1_DIRECT, TIER_2_REPOSITIONING, TIER_3_ICC_DESK
  is_verified: boolean("is_verified").default(false),
  verified_at: timestamp("verified_at"),
  active_aircraft_inventory: jsonb("active_aircraft_inventory").default([]),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const aircraft_inventory = pgTable("aircraft_inventory", {
  id: serial("id").primaryKey(),
  aircraft_uuid: uuid("aircraft_uuid").defaultRandom().unique(),
  operator_id: integer("operator_id").references(() => operators.id),
  tail_number: varchar("tail_number", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }),
  year_of_manufacture: integer("year_of_manufacture"),
  max_passengers: integer("max_passengers").notNull().default(8),
  cruise_speed_ktas: numeric("cruise_speed_ktas").default('450.00'),
  range_nm: numeric("range_nm").default('3200.00'),
  hourly_rate_usd: numeric("hourly_rate_usd").notNull().default('4000.00'),
  image_url: text("image_url"),
  images: jsonb("images").default([]),
  virtual_tour_url: text("virtual_tour_url"),
  is_available: boolean("is_available").default(true),
  current_location_icao: varchar("current_location_icao", { length: 10 }).default('DNMM'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  client_uuid: uuid("client_uuid").defaultRandom().unique(),
  broker_id: integer("broker_id").references(() => brokers.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  passport_number: varchar("passport_number", { length: 100 }),
  nationality: varchar("nationality", { length: 100 }),
  status: varchar("status", { length: 50 }).default('ACTIVE'),
  preferences: jsonb("preferences").default({}),
  total_flights: integer("total_flights").default(0),
  total_spend_usd: numeric("total_spend_usd").default('0.00'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const missions = pgTable("missions", {
  id: varchar("id", { length: 50 }).primaryKey(), // 15D-001, 15D-8941
  mission_uuid: uuid("mission_uuid").defaultRandom().unique(),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  operator_id: integer("operator_id").references(() => operators.id),
  client_name: varchar("client_name", { length: 255 }),
  client_email: varchar("client_email", { length: 255 }),
  client_phone: varchar("client_phone", { length: 50 }),
  departure_airport: varchar("departure_airport", { length: 20 }).notNull(),
  arrival_airport: varchar("arrival_airport", { length: 20 }).notNull(),
  departure_date: timestamp("departure_date"),
  return_date: timestamp("return_date"),
  aircraft_type: varchar("aircraft_type", { length: 100 }),
  aircraft_class: varchar("aircraft_class", { length: 50 }).default('HEAVY'),
  operator_aircraft: varchar("operator_aircraft", { length: 100 }),
  trip_type: varchar("trip_type", { length: 20 }).default('ONEWAY'),
  passengers: integer("passengers").default(1),
  status: varchar("status", { length: 50 }).default('INTAKE_SUBMITTED'),
  payment_status: varchar("payment_status", { length: 50 }).default('AWAITING_PAYMENT'),
  estimated_lower: numeric("estimated_lower"),
  estimated_upper: numeric("estimated_upper"),
  midpoint_estimate: numeric("midpoint_estimate"),
  total_estimate: numeric("total_estimate"),
  upfront_deposit: numeric("upfront_deposit").default('0.00'),
  outstanding_balance: numeric("outstanding_balance").default('0.00'),
  escrow_deposit: numeric("escrow_deposit").default('0.00'),
  platform_fee: numeric("platform_fee").default('0.00'),
  gross_operator_quote: numeric("gross_operator_quote"),
  broker_markup: numeric("broker_markup").default('0.00'),
  is_config_locked: boolean("is_config_locked").default(false),
  version: integer("version").default(1),
  legs: jsonb("legs").default([]),
  mission_customizations: jsonb("mission_customizations").default({}),
  raw_payload: jsonb("raw_payload").default({}),
  vip_payment_url: text("vip_payment_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  booking_code: varchar("booking_code", { length: 50 }).notNull().unique(),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  operator_id: integer("operator_id").references(() => operators.id),
  origin: varchar("origin", { length: 20 }).notNull(),
  destination: varchar("destination", { length: 20 }).notNull(),
  departure_time: timestamp("departure_time"),
  arrival_time: timestamp("arrival_time"),
  aircraft_type: varchar("aircraft_type", { length: 100 }),
  status: varchar("status", { length: 50 }).default('INQUIRY'),
  total_estimate: numeric("total_estimate"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const flight_passengers = pgTable("flight_passengers", {
  id: serial("id").primaryKey(),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  passport_number: varchar("passport_number", { length: 100 }),
  nationality: varchar("nationality", { length: 100 }),
  date_of_birth: timestamp("date_of_birth"),
  weight_kg: numeric("weight_kg"),
  dietary_preferences: text("dietary_preferences"),
  medical_notes: text("medical_notes"),
  emergency_contact: varchar("emergency_contact", { length: 255 }),
  clearance_status: varchar("clearance_status", { length: 50 }).default('CLEARED'),
  created_at: timestamp("created_at").defaultNow(),
});

export const flight_logs = pgTable("flight_logs", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  booking_code: varchar("booking_code", { length: 50 }),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  operator_id: integer("operator_id").references(() => operators.id),
  origin: varchar("origin", { length: 20 }).notNull(),
  destination: varchar("destination", { length: 20 }).notNull(),
  aircraft_type: varchar("aircraft_type", { length: 100 }),
  departure_time: timestamp("departure_time"),
  arrival_time: timestamp("arrival_time"),
  flight_duration_hours: numeric("flight_duration_hours"),
  passengers: integer("passengers").default(1),
  estimated_cost_usd: numeric("estimated_cost_usd"),
  actual_cost_usd: numeric("actual_cost_usd"),
  status: varchar("status", { length: 50 }).default('SCHEDULED'),
  telemetry_data: jsonb("telemetry_data").default({}),
  created_at: timestamp("created_at").defaultNow(),
});

export const leads_pipeline = pgTable("leads_pipeline", {
  id: serial("id").primaryKey(),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  deal_code: varchar("deal_code", { length: 50 }),
  client_name: varchar("client_name", { length: 255 }),
  client_email: varchar("client_email", { length: 255 }),
  client_phone: varchar("client_phone", { length: 50 }),
  origin: varchar("origin", { length: 20 }),
  destination: varchar("destination", { length: 20 }),
  aircraft_category: varchar("aircraft_category", { length: 100 }),
  estimated_value_usd: numeric("estimated_value_usd"),
  broker_markup_percent: numeric("broker_markup_percent").default('10.00'),
  broker_commission_usd: numeric("broker_commission_usd").default('0.00'),
  stage: varchar("stage", { length: 50 }).default('Inquiry'), // Inquiry, Quote Sent, Proposal Viewed, Contract Signed, Commission Settled
  notes: text("notes"),
  last_interaction_at: timestamp("last_interaction_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const eye_of_god_logs = pgTable("eye_of_god_logs", {
  id: serial("id").primaryKey(),
  device_fingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  departure_airport: varchar("departure_airport", { length: 20 }),
  arrival_airport: varchar("arrival_airport", { length: 20 }),
  broker_id: integer("broker_id").references(() => brokers.id),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  search_query: text("search_query"),
  metadata: jsonb("metadata").default({}),
  linked_at: timestamp("linked_at"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const timeline_logs = pgTable("timeline_logs", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  event_type: varchar("event_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  proposal_code: varchar("proposal_code", { length: 50 }).notNull().unique(),
  flight_id: integer("flight_id").references(() => flights.id),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  agency_name: varchar("agency_name", { length: 255 }).notNull(),
  theme_color: varchar("theme_color", { length: 50 }).default('#1877F2'),
  font_family: varchar("font_family", { length: 50 }).default('Lexend'),
  broker_markup_usd: numeric("broker_markup_usd").default('0.00'),
  baseline_wholesale_usd: numeric("baseline_wholesale_usd").notNull(),
  client_total_usd: numeric("client_total_usd").notNull(),
  options: jsonb("options").default([]),
  is_viewed: boolean("is_viewed").default(false),
  viewed_at: timestamp("viewed_at"),
  pdf_url: text("pdf_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contract_code: varchar("contract_code", { length: 50 }).notNull().unique(),
  flight_id: integer("flight_id").references(() => flights.id),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  status: varchar("status", { length: 50 }).default('DRAFT'),
  terms_text: text("terms_text"),
  cancellation_rules: jsonb("cancellation_rules").default({}),
  signed_by_name: varchar("signed_by_name", { length: 255 }),
  signed_at: timestamp("signed_at"),
  signature_ip: varchar("signature_ip", { length: 50 }),
  document_url: text("document_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  payment_uuid: uuid("payment_uuid").defaultRandom().unique(),
  flight_id: integer("flight_id").references(() => flights.id),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  booking_code: varchar("booking_code", { length: 50 }),
  payment_reference: varchar("payment_reference", { length: 100 }).unique(),
  amount: numeric("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default('USD'),
  payment_type: varchar("payment_type", { length: 50 }).default('ACTIVATION_DEPOSIT'),
  escrow_status: varchar("escrow_status", { length: 50 }).default('HOLD'),
  proof_of_payment_url: text("proof_of_payment_url"),
  verified_by: varchar("verified_by", { length: 100 }),
  verified_at: timestamp("verified_at"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipient_email: varchar("recipient_email", { length: 255 }).notNull(),
  recipient_type: varchar("recipient_type", { length: 50 }).default('BROKER'),
  mission_id: varchar("mission_id", { length: 50 }).references(() => missions.id),
  type: varchar("type", { length: 50 }).default('SYSTEM'),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const POSTGRESQL_DDL_SCHEMA = `
-- ==============================================================================
-- 15D WINGS EXECUTIVE AVIATION PLATFORM
-- FULL PRODUCTION POSTGRESQL IDEMPOTENT DATABASE SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS brokers (
    id SERIAL PRIMARY KEY,
    broker_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255) DEFAULT '15D Executive Aviation Brokerage',
    phone VARCHAR(50),
    device_fingerprint VARCHAR(255),
    agency_clearance_status VARCHAR(50) DEFAULT 'ACTIVE',
    is_soft_deleted BOOLEAN DEFAULT FALSE,
    has_verified_operator BOOLEAN DEFAULT FALSE,
    last_client_onboarded_at TIMESTAMP WITH TIME ZONE,
    last_flight_booked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    tier VARCHAR(50) DEFAULT 'TIER_1_DIRECT',
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    active_aircraft_inventory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aircraft_inventory (
    id SERIAL PRIMARY KEY,
    aircraft_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
    tail_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
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
    status VARCHAR(50) DEFAULT 'ACTIVE',
    preferences JSONB DEFAULT '{}'::jsonb,
    total_flights INT DEFAULT 0,
    total_spend_usd NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS missions (
    id VARCHAR(50) PRIMARY KEY,
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
    trip_type VARCHAR(20) DEFAULT 'ONEWAY',
    passengers INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'INTAKE_SUBMITTED',
    payment_status VARCHAR(50) DEFAULT 'AWAITING_PAYMENT',
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
    stage VARCHAR(50) DEFAULT 'Inquiry',
    notes TEXT,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'DRAFT',
    terms_text TEXT,
    cancellation_rules JSONB DEFAULT '{}'::jsonb,
    signed_by_name VARCHAR(255),
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_ip VARCHAR(50),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    payment_type VARCHAR(50) DEFAULT 'ACTIVATION_DEPOSIT',
    escrow_status VARCHAR(50) DEFAULT 'HOLD',
    proof_of_payment_url TEXT,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS timeline_logs (
    id SERIAL PRIMARY KEY,
    flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) DEFAULT 'BROKER',
    mission_id VARCHAR(50) REFERENCES missions(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
