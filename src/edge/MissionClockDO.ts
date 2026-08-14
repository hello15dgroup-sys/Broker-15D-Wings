/// <reference types="@cloudflare/workers-types" />
import { Env } from './index';
import { createClient } from '@supabase/supabase-js';

export class MissionClockDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private supabase: any;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/schedule")) {
      const payload = await request.json() as any;
      await this.handleScheduling(payload);
      return new Response(JSON.stringify({ success: true, message: "Charter scheduled in Clock Engine" }), {
          headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname.endsWith("/document-expiry")) {
      const payload = await request.json() as any;
      await this.handleDocumentExpiryUpdate(payload);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname.endsWith("/payment/verified")) {
      await this.handlePaymentVerification();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("MissionClockDO Active");
  }

  private async handleDocumentExpiryUpdate(payload: any) {
     const { doc_type, expiry_date, mission_id } = payload;
     if (!expiry_date) return;

     // Store expiry
     let expiries = await this.state.storage.get<any>('document_expiries') || {};
     expiries[doc_type] = expiry_date;
     await this.state.storage.put('document_expiries', expiries);

     // Check if this expires before the mission ETD
     const expTime = new Date(expiry_date).getTime();
     const now = Date.now();
     
     // Set alarm if expiry is in the future but we don't have a closer alarm
     if (expTime > now) {
         const currentAlarm = await this.state.storage.getAlarm();
         if (!currentAlarm || expTime < currentAlarm) {
             // Wake up exactly when it expires
             await this.state.storage.setAlarm(expTime);
         }
     }
  }

  async alarm() {
    // Wake up point for temporal triggers
    const missionId = await this.state.storage.get<string>('mission_id');
    if (!missionId) return;

    const { data: mission } = await this.supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();
      
    if (!mission || mission.status === 'CANCELLED' || mission.status === 'COMPLETED') {
        return; // No further action required
    }

    const etd = new Date(mission.etd || new Date().toISOString()).getTime();
    const now = Date.now();
    
    // Auto-complete mission if expired
    if (now > etd) {
        await this.supabase.from('missions').update({ status: 'COMPLETED' }).eq('id', missionId);
        return;
    }

    const tMinusHours = (etd - now) / (1000 * 60 * 60);

    const paymentStatus = mission.payment_status || 'PENDING';
    
    // Check Document Expiries
    const expiries = await this.state.storage.get<any>('document_expiries') || {};
    for (const [doc_type, exp] of Object.entries(expiries)) {
        if (new Date(exp as string).getTime() <= now) {
            // Document expired!
            await this.sendWarning(missionId, "EXPIRY", `Pillar Compromised: ${doc_type} Expired`, 
               `Esteemed Client, we must regrettably inform you that the required ${doc_type} has expired prior to departure. The mission is presently on a temporal hold pending immediate remediation.`
            );
            // Optionally, we could remove it from expiries so we don't keep firing
            delete expiries[doc_type];
        }
    }
    await this.state.storage.put('document_expiries', expiries);

    // Evaluate Payment Pillar at T-48
    if (tMinusHours <= 48 && tMinusHours > 47 && paymentStatus !== 'SETTLED') {
        // T-48 Cancellation Trigger
        await this.cancelMission(missionId, "T-48 Payment Visibility Trigger. Funds not secured.");
    } 
    else if (tMinusHours <= 72 && tMinusHours > 70 && paymentStatus !== 'SETTLED') {
         await this.sendWarning(missionId, "T-72", 
            "Action Required: Final Payment Finalization", 
            "Esteemed Client, to guarantee the seamless execution of your upcoming itinerary, please be advised that final settlement is required within 24 hours. The highest echelons of aviation compliance mandate secured escrow T-48 hours prior to wheels up (UTC). We appreciate your prompt arrangement."
         );
    }
    else if (tMinusHours <= 60 && tMinusHours > 58 && paymentStatus !== 'SETTLED') {
        await this.sendWarning(missionId, "T-60", 
           "Urgent Notice: Impending Escrow Deadline", 
           "Esteemed Client, we respectfully remind you that your flight execution window requires settled funds within 12 hours. To maintain our white-glove commitment and aircraft allocation, immediate settlement is requested."
        );
    }

    // Evaluate Next Alarm
    if (tMinusHours > 48) {
       // Check hourly as we get closer
        await this.state.storage.setAlarm(Date.now() + 1000 * 60 * 60);
    }
  }

  private async handleScheduling(payload: any) {
    const { mission_id, etd } = payload;
    await this.state.storage.put('mission_id', mission_id);
    await this.state.storage.put('etd', etd);

    // Initial evaluation to set first alarm
    const etdTime = new Date(etd).getTime();
    const now = Date.now();
    const tMinusHours = (etdTime - now) / (1000 * 60 * 60);

    if (tMinusHours > 72) {
       // Wake up around T-72
       await this.state.storage.setAlarm(etdTime - (72 * 60 * 60 * 1000));
    } else {
       // Start polling every hour
       await this.state.storage.setAlarm(Date.now() + 1000 * 60 * 60);
    }
  }

  private async handlePaymentVerification() {
     // Broadcast to ICC and Client DO
     const missionId = await this.state.storage.get<string>('mission_id');
     if (!missionId) return;

     // Activation sequence
     if (this.env.ICC_DO) {
         const stub = this.env.ICC_DO.get(this.env.ICC_DO.idFromName(missionId));
         await stub.fetch(`https://icc/payment/confirm`, { method: "POST" });
     }
  }

  private async sendWarning(missionId: string, phase: string, subject: string, message: string) {
       const url = "https://localhost/api/comms/send";
       
       await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              eventType: 'CLOCK_WARNING',
              to: 'hello.15dgroup@gmail.com',
              mission_id: missionId,
              metadata: { phase, subject, message }
          })
       });
  }

  private async cancelMission(missionId: string, reason: string) {
      // Set status in database
      await this.supabase.from('missions').update({ 
          status: 'CANCELLED', 
          cancellation_reason: reason 
      }).eq('id', missionId);

      // Notify Client
      const cancelMsg = "It is with deep regret we inform you that Mission allocation has been withdrawn due to uncleared funds at the T-48 regulatory gate. We remain at your disposal for future scheduling.";
      await this.sendWarning(missionId, "T-48", "Charter Execution Cancelled", cancelMsg);
      
      // Notify ICC
      if (this.env.ICC_DO) {
        // Trigger abort logic if DO has it
      }
  }
}
