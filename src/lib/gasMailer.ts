import { supabase } from './supabase';

interface GasMailPayload {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  messagePayload: string;
  purpose: 'AIRCRAFT_VERIFICATION' | 'MISSION_COMPLETED' | 'PAYMENT_REVIEW' | 'SYSTEM_ALERT';
  meta?: {
    operatorId?: string;
    tailNumber?: string;
    clearanceStatus?: string;
  };
}

/**
 * Sends a communication payload to the Google Apps Script Webhook.
 * Falls back gracefully to console logs if no webhook URL is defined.
 */
export async function sendGasEmail(payload: GasMailPayload): Promise<boolean> {
  // Let user check local storage or process.env configuration
  const webhookUrl = localStorage.getItem('GAS_EMAIL_WEBHOOK_URL') || 'https://portalcomms.15dwingsltd.workers.dev';
  
  console.log(`[GAS Mailer] Preparing to dispatch: ${payload.subject} to ${payload.recipientEmail} [Purpose: ${payload.purpose}]`);
  
  if (!webhookUrl) {
    console.warn("[GAS Mailer] No GAS_EMAIL_WEBHOOK_URL configured. Communication simulated below:");
    console.log("%c--- SIMULATED GAS EMAIL OUTBOX ---", "color: #3b82f6; font-weight: bold;");
    console.log(`To: ${payload.recipientName} (${payload.recipientEmail})`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Payload: ${payload.messagePayload}`);
    console.log("---------------------------------");
    return true;
  }

  try {
    new URL(webhookUrl);
  } catch (e) {
    console.error("[GAS Mailer] Invalid webhook URL configured:", webhookUrl);
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log("[GAS Mailer] Payload pushed to GAS Hub successfully.");
    return true;
  } catch (error) {
    console.error("[GAS Mailer] Failed to dispatch payload to GAS Webhook:", error);
    // If it's a fetch error, log specific details if possible
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error("[GAS Mailer] Network error (DNS, CORS, or blocked URL)");
    }
    return false;
  }
}
