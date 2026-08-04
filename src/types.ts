export type MissionStatus = 
  | 'INTAKE_SUBMITTED' 
  | 'DECISION_REVIEW' 
  | 'ACCEPTED_PENDING_CONFIRMATION' 
  | 'CONFIRMATION_LOCKED' 
  | 'EMAIL_VERIFIED' 
  | 'ACCESS_GRANTED' 
  | 'DOCUMENT_UPLOAD' 
  | 'DOCUMENTS_UNDER_REVIEW' 
  | 'DEPOSIT_CONFIRMED' 
  | 'PRE_ACTIVATION' 
  | 'ACTIVATED' 
  | 'EXECUTING' 
  | 'COMPLETED' 
  | 'ARCHIVED' 
  | 'ABORTED' 
  | 'ROTATING' 
  | 'HOLD_STATE';

export type CCIBand = 
  | 'CCI-0' // Standard
  | 'CCI-1' // Light 
  | 'CCI-2' // Moderate
  | 'CCI-3' // High / Structured
  | 'CCI-X-T' // Time constrained
  | 'CCI-X-S'; // Non-executable

export type OperatorTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface Payment {
  id: string;
  mission_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface MissionCustomization {
  id: string;
  mission_id: string;
  cci_level: string;
  classification: string;
  request_details: string;
  status: string;
  created_at: string;
}

export interface Mission {
  id: string; // 15D-XXXXX
  client_email: string;
  client_name?: string;
  status: MissionStatus;
  cci_score: number;
  mhi_score: number; // 0-100 (Internal index)
  estimated_lower: number;
  estimated_upper: number;
  passenger_manifest: any[];
  execution_timestamp: number;
  created_at: string;
  last_event?: string;
  cci_band?: CCIBand;
  payments?: Payment[];
  mission_customizations?: MissionCustomization[];
  payment_status?: string;
  outstanding_balance?: number;
  commitment_activation_fee?: number;
  upfront_deposit?: number;
  legs?: any[];
  operator_quote?: number;
  aircraft_available?: boolean;
}

export type FleetState = 'DRAFT' | 'VERIFIED_TEXT' | 'FULLY_COMPLIANT';

export interface Operator {
  id: string;
  name: string;
  compliance_status: 'FIT' | 'AT_RISK' | 'UNFIT';
  fleet_state: FleetState;
  integrity_score: number; // 0-100
  rotation_count: number;
  tier?: OperatorTier;
}

export interface GroundIntelReport {
  report_id: string;
  mission_id: string;
  aircraft_on_ramp: boolean;
  crew_present: boolean;
  fuel_truck_present: boolean;
  contradiction_flag: boolean;
  notes?: string;
  created_at: number;
}

export interface AuditLog {
  id: string;
  mission_id?: string;
  event_type: string;
  actor: any;
  payload: any;
  created_at: number;
}
