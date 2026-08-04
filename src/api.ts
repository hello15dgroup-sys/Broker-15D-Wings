import { Mission, MissionStatus } from './types';

const API_BASE = {
  MISSION_CONTROL: (import.meta as any).env.VITE_MISSION_CONTROL_API,
  CLOCKS: (import.meta as any).env.VITE_MISSION_CLOCKS_API,
  CHAT: (import.meta as any).env.VITE_MISSION_CHAT_API,
  DOCS: (import.meta as any).env.VITE_DOCUMENT_API,
  PIVOT: (import.meta as any).env.VITE_PIVOT_ENGINE_API,
  GIO: (import.meta as any).env.VITE_GIO_INTEL_API,
  VERIFY: (import.meta as any).env.VITE_OPERATORS_VERIFY_API,
};

async function secureFetch(url: string, options: RequestInit = {}) {
  if (!url || url.includes('undefined')) {
    console.error(`[API] Invalid URL: ${url}`);
    throw new Error(`API URL is not configured: ${url}`);
  }
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
    throw new Error((errorData as any).error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const missionApi = {
  // Mission Flow
  createMission: (payload: Partial<Mission>) => 
    secureFetch(`${API_BASE.MISSION_CONTROL}/mission/event`, {
      method: 'POST',
      body: JSON.stringify({ event_type: 'INTAKE_SUBMITTED', ...payload }),
    }),

  getMissionState: (missionId: string): Promise<Mission> =>
    secureFetch(`${API_BASE.MISSION_CONTROL}/mission/${missionId}/state`) as Promise<Mission>,

  // Clocks
  getClocks: (missionId: string) =>
    secureFetch(`${API_BASE.CLOCKS}/clock/${missionId}`),

  // GIO
  submitGIOReport: (payload: any) =>
    secureFetch(`${API_BASE.GIO}/gio/report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Pivot Engine
  evaluatePivot: (missionId: string) =>
    secureFetch(`${API_BASE.PIVOT}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ mission_id: missionId }),
    }),

  // Document Verification
  uploadDocument: (formData: FormData) =>
    secureFetch(`${API_BASE.DOCS}/upload`, {
      method: 'POST',
      body: formData, // fetch automatically handles boundary for FormData
    }),
};
