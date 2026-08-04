import { Env } from './index';

export async function handleCommsAPI(request: Request, env: Env): Promise<Response> {
  const payload = await request.json() as any;
  const { eventType, to, mission_id, operator_id, metadata } = payload;
  
  // 1. Log or store Dashboard Notification here
  // (In a real setup, we'd use env.schema or Supabase to write a notification row)
  
  // 2. Dispatch Email via Google Apps Script (GAS) Web App
  const GAS_URL = env.GAS_WEBHOOK_URL;
  if (!GAS_URL) {
    return new Response(JSON.stringify({ error: "GAS Webhook not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  try {
     const emailRecipient = to || 'ops@15dwings.com.ng';
     const subject = `Mission Update: ${mission_id} - ${eventType}`;
     
     await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: emailRecipient,
            subject: subject,
            body: metadata ? JSON.stringify(metadata, null, 2) : "No additional details.",
            mission_id,
            operator_id
        })
     });
  } catch(e: any) {
     console.error("GAS Email failed", e);
     return new Response(JSON.stringify({ error: "Failed to reach GAS webhook", details: e.message }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
  
  return new Response(JSON.stringify({ success: true, message: "Comms sent successfully" }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
  });
}
