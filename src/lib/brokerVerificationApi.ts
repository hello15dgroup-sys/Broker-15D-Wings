/**
 * 15D Wings Broker Verification and Onboarding Orchestration Worker Client
 * Base URL: https://broker-verification.15dwingsltd.workers.dev
 */

export const WORKER_BASE_URL = 'https://broker-verification.15dwingsltd.workers.dev';

export interface ManagedOperator {
  id: string;
  company_name: string;
  is_verified: boolean;
}

export interface BrokerClearanceData {
  broker_id: string;
  agency_name: string;
  organization: string;
  principal_name?: string;
  email: string;
  is_verified: boolean;
  agency_clearance_status: 'ACTIVE' | 'SUSPENDED' | string;
  has_verified_operator: boolean;
  managed_operators_count: number;
  managed_operators: ManagedOperator[];
}

export type BrokerUIState =
  | { state: 'IDLE' }
  | { state: 'LOADING'; message?: string }
  | { state: 'SUCCESS'; broker: BrokerClearanceData }
  | { state: 'SUSPENDED'; broker: BrokerClearanceData; message: string }
  | { state: 'NOT_FOUND'; message: string; brokerId?: string }
  | { state: 'INVALID_UUID'; message: string; rawError?: string; input: string }
  | { state: 'NETWORK_ERROR'; message: string }
  | { state: 'ERROR'; message: string };

export interface OperatorEvaluationResult {
  operator_id: string;
  verification_stage: string;
  is_fully_verified: boolean;
  broker_credited: boolean;
  status?: string;
  message?: string;
}

/**
 * UUID format validator (RFC 4122)
 */
export function isValidUUID(str: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

/**
 * Endpoint 1: Launch Onboarding Portal
 * GET /v1/broker/launch-onboarding?broker_id={UUID}&email={email}
 */
export async function launchBrokerOnboarding(
  brokerId?: string,
  email?: string
): Promise<{ success: boolean; redirect_url?: string; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (brokerId) params.append('broker_id', brokerId);
    if (email) params.append('email', email);

    const queryString = params.toString();
    const url = `${WORKER_BASE_URL}/v1/broker/launch-onboarding${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reach onboarding launch worker.'
    };
  }
}

/**
 * Endpoint 2: Query Broker Status & Clearance
 * GET /v1/broker/status?broker_id={UUID}
 */
export async function fetchBrokerStatus(
  brokerId: string,
  uiCallback?: (state: BrokerUIState) => void
): Promise<BrokerUIState> {
  const cleanId = (brokerId || '').trim();

  // Initial loading state
  uiCallback?.({ state: 'LOADING', message: 'Validating broker clearance...' });

  // Client-side early check for invalid format
  if (!cleanId) {
    const invalidState: BrokerUIState = {
      state: 'INVALID_UUID',
      message: 'Please enter a valid cryptographic UUID string.',
      input: cleanId
    };
    uiCallback?.(invalidState);
    return invalidState;
  }

  try {
    const url = `${WORKER_BASE_URL}/v1/broker/status?broker_id=${encodeURIComponent(cleanId)}`;
    const response = await fetch(url);
    const data = await response.json();

    // 1. Check for backend error (e.g. 400 Bad Request or 22P02 Postgres UUID error)
    if (!data.success) {
      const errorMsg = data.error || 'Request failed';
      // Detect 22P02 Postgres invalid input syntax for UUID
      if (errorMsg.includes('22P02') || errorMsg.toLowerCase().includes('invalid input syntax for type uuid')) {
        const invalidState: BrokerUIState = {
          state: 'INVALID_UUID',
          message: 'Please enter a valid cryptographic UUID string.',
          rawError: errorMsg,
          input: cleanId
        };
        uiCallback?.(invalidState);
        return invalidState;
      }

      const errState: BrokerUIState = { state: 'ERROR', message: errorMsg };
      uiCallback?.(errState);
      return errState;
    }

    // 2. Custom Status Check: BROKER_NOT_FOUND
    if (data.broker?.status === 'BROKER_NOT_FOUND') {
      const notFoundState: BrokerUIState = {
        state: 'NOT_FOUND',
        message: data.broker.message || 'Broker profile not found or link expired.',
        brokerId: cleanId
      };
      uiCallback?.(notFoundState);
      return notFoundState;
    }

    const broker = data.broker as BrokerClearanceData;

    // 3. Check Clearance Status: SUSPENDED vs ACTIVE
    if (broker.agency_clearance_status === 'SUSPENDED') {
      const suspendedState: BrokerUIState = {
        state: 'SUSPENDED',
        broker,
        message: 'Agency clearance is currently inactive. Contact compliance.'
      };
      uiCallback?.(suspendedState);
      return suspendedState;
    }

    // 4. Success State (ACTIVE clearance)
    const successState: BrokerUIState = {
      state: 'SUCCESS',
      broker
    };
    uiCallback?.(successState);
    return successState;

  } catch (err: any) {
    const netState: BrokerUIState = {
      state: 'NETWORK_ERROR',
      message: err.message || 'Unable to connect to verification worker.'
    };
    uiCallback?.(netState);
    return netState;
  }
}

/**
 * Endpoint 3: Evaluate Operator Verification & Credit Broker
 * GET /v1/verification/evaluate?operator_id={UUID}
 */
export async function evaluateOperatorVerification(
  operatorId: string
): Promise<{ success: boolean; evaluation?: OperatorEvaluationResult; error?: string }> {
  try {
    const cleanOpId = (operatorId || '').trim();
    const url = `${WORKER_BASE_URL}/v1/verification/evaluate?operator_id=${encodeURIComponent(cleanOpId)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error evaluating operator verification.'
    };
  }
}
