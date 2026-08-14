import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb } from "drizzle-orm/pg-core";

export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  device_fingerprint: varchar("device_fingerprint", { length: 255 }),
  agency_clearance_status: varchar("agency_clearance_status", { length: 50 }).default('ACTIVE'), // ACTIVE, SUSPENDED_90_DAYS, DEACTIVATED
  is_soft_deleted: boolean("is_soft_deleted").default(false),
  has_verified_operator: boolean("has_verified_operator").default(false),
  last_client_onboarded_at: timestamp("last_client_onboarded_at"),
  last_flight_booked_at: timestamp("last_flight_booked_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  broker_id: integer("broker_id").references(() => brokers.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  status: varchar("status", { length: 50 }).default('ACTIVE'),
  total_flights: integer("total_flights").default(0),
  total_spend_usd: numeric("total_spend_usd").default('0'),
  created_at: timestamp("created_at").defaultNow(),
});

export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  broker_id: integer("broker_id").references(() => brokers.id),
  name: varchar("name", { length: 255 }).notNull(),
  tail_number: varchar("tail_number", { length: 50 }),
  operator_license: varchar("operator_license", { length: 100 }),
  is_verified: boolean("is_verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  booking_code: varchar("booking_code", { length: 50 }).notNull().unique(),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  operator_id: integer("operator_id").references(() => operators.id),
  status: varchar("status", { length: 50 }).default('INQUIRY'), // INQUIRY, PROPOSED, SIGNED, CONFIRMED, IN_FLIGHT, COMPLETED, CANCELLED
  total_estimate: numeric("total_estimate"),
  created_at: timestamp("created_at").defaultNow(),
});

export const flight_logs = pgTable("flight_logs", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  booking_code: varchar("booking_code", { length: 50 }),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  operator_id: integer("operator_id").references(() => operators.id),
  origin: varchar("origin", { length: 10 }).notNull(),
  destination: varchar("destination", { length: 10 }).notNull(),
  aircraft_type: varchar("aircraft_type", { length: 100 }),
  departure_time: timestamp("departure_time"),
  arrival_time: timestamp("arrival_time"),
  flight_duration_hours: numeric("flight_duration_hours"),
  passengers: integer("passengers").default(1),
  estimated_cost_usd: numeric("estimated_cost_usd"),
  actual_cost_usd: numeric("actual_cost_usd"),
  status: varchar("status", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const leads_pipeline = pgTable("leads_pipeline", {
  id: serial("id").primaryKey(),
  broker_id: integer("broker_id").references(() => brokers.id),
  client_id: integer("client_id").references(() => clients.id),
  deal_code: varchar("deal_code", { length: 50 }),
  client_name: varchar("client_name", { length: 255 }),
  origin: varchar("origin", { length: 10 }),
  destination: varchar("destination", { length: 10 }),
  aircraft_category: varchar("aircraft_category", { length: 100 }),
  estimated_value_usd: numeric("estimated_value_usd"),
  broker_markup_percent: numeric("broker_markup_percent"),
  broker_commission_usd: numeric("broker_commission_usd"),
  stage: varchar("stage", { length: 50 }).default('Inquiry'), // Inquiry, Quote Sent, Proposal Viewed, Contract Signed, Commission Settled
  last_interaction_at: timestamp("last_interaction_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const eye_of_god_logs = pgTable("eye_of_god_logs", {
  id: serial("id").primaryKey(),
  device_fingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  departure_airport: varchar("departure_airport", { length: 10 }),
  arrival_airport: varchar("arrival_airport", { length: 10 }),
  broker_id: integer("broker_id").references(() => brokers.id),
  linked_at: timestamp("linked_at"),
  search_query: text("search_query"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const timeline_logs = pgTable("timeline_logs", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  event_type: varchar("event_type", { length: 100 }), // proposal_viewed, contract_sent, payment_link_sent, itinerary_updated
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  broker_markup: numeric("broker_markup"),
  options: jsonb("options"), // Array of tailored aircraft options
  created_at: timestamp("created_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  status: varchar("status", { length: 50 }), // DRAFT, SIGNED
  cancellation_rules: jsonb("cancellation_rules"),
  created_at: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  flight_id: integer("flight_id").references(() => flights.id),
  broker_id: integer("broker_id").references(() => brokers.id),
  amount: numeric("amount"),
  currency: varchar("currency", { length: 10 }), // fiat, wire, stablecoin
  escrow_status: varchar("escrow_status", { length: 50 }), // HOLD, CLEARED, REFUNDED
  created_at: timestamp("created_at").defaultNow(),
});

export const POSTGRESQL_DDL_SCHEMA = `
-- 15D WINGS BROKER CRM POSTGRESQL DDL SCHEMA

CREATE TABLE IF NOT EXISTS brokers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  device_fingerprint VARCHAR(255),
  agency_clearance_status VARCHAR(50) DEFAULT 'ACTIVE',
  is_soft_deleted BOOLEAN DEFAULT FALSE,
  has_verified_operator BOOLEAN DEFAULT FALSE,
  last_client_onboarded_at TIMESTAMP,
  last_flight_booked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  total_flights INT DEFAULT 0,
  total_spend_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  tail_number VARCHAR(50),
  operator_license VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flights (
  id SERIAL PRIMARY KEY,
  booking_code VARCHAR(50) NOT NULL UNIQUE,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  client_id INT REFERENCES clients(id) ON DELETE SET NULL,
  operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'INQUIRY',
  total_estimate NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flight_logs (
  id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
  booking_code VARCHAR(50),
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  client_id INT REFERENCES clients(id) ON DELETE SET NULL,
  operator_id INT REFERENCES operators(id) ON DELETE SET NULL,
  origin VARCHAR(10) NOT NULL,
  destination VARCHAR(10) NOT NULL,
  aircraft_type VARCHAR(100),
  departure_time TIMESTAMP,
  arrival_time TIMESTAMP,
  flight_duration_hours NUMERIC,
  passengers INT DEFAULT 1,
  estimated_cost_usd NUMERIC,
  actual_cost_usd NUMERIC,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads_pipeline (
  id SERIAL PRIMARY KEY,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  client_id INT REFERENCES clients(id) ON DELETE SET NULL,
  deal_code VARCHAR(50),
  client_name VARCHAR(255),
  origin VARCHAR(10),
  destination VARCHAR(10),
  aircraft_category VARCHAR(100),
  estimated_value_usd NUMERIC,
  broker_markup_percent NUMERIC,
  broker_commission_usd NUMERIC,
  stage VARCHAR(50) DEFAULT 'Inquiry',
  last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eye_of_god_logs (
  id SERIAL PRIMARY KEY,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  departure_airport VARCHAR(10),
  arrival_airport VARCHAR(10),
  broker_id INT REFERENCES brokers(id) ON DELETE SET NULL,
  linked_at TIMESTAMP,
  search_query TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_logs (
  id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  event_type VARCHAR(100),
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  broker_markup NUMERIC,
  options JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  status VARCHAR(50),
  cancellation_rules JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(id) ON DELETE CASCADE,
  broker_id INT REFERENCES brokers(id) ON DELETE CASCADE,
  amount NUMERIC,
  currency VARCHAR(10),
  escrow_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

