/// <reference types="@cloudflare/workers-types" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MISSION_DO: DurableObjectNamespace;
  OPERATOR_DO: DurableObjectNamespace;
  ICC_DO: DurableObjectNamespace;
}

export class ICCPortalDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private supabase: SupabaseClient;
  private missionId: string | null = null;
  private missionState: any = null;
  private connections: Set<WebSocket> = new Set();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    this.state.blockConcurrencyWhile(async () => {
      this.missionId = await this.state.storage.get<string>('missionId') || null;
      if (this.missionId) await this.loadState();
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.handleWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname.endsWith("/init")) {
      const { missionId } = await request.json() as any;
      this.missionId = missionId;
      await this.state.storage.put('missionId', missionId);
      await this.loadState();
      return Response.json({ success: true, state: this.missionState });
    }

    // Evaluates CCI (Customization Complexity Index)
    if (url.pathname.endsWith("/cci/evaluate")) {
      const payload = await request.json() as any;
      const cci = this.calculateCCI(payload);
      return Response.json({ success: true, cci });
    }

    // Handles Tier Transition (Soft Hold, Warm Activation, Full Activation)
    if (url.pathname.endsWith("/tier/transition")) {
      const { targetTier } = await request.json() as any;
      const result = await this.transitionActivationTier(targetTier);
      return Response.json({ success: true, result });
    }

    // Handles Disbursement Phases
    if (url.pathname.endsWith("/escrow/disburse")) {
      const { phase } = await request.json() as any;
      const result = await this.executePhasedDisbursement(phase);
      return Response.json({ success: true, result });
    }

    // Handles ORM Proposals from Operators
    if (url.pathname.endsWith("/orm/propose")) {
      const proposal = await request.json() as any;
      await this.handleORMProposal(proposal);
      return Response.json({ success: true });
    }

    // Updates Pillar data from Operator DO
    if (url.pathname.endsWith("/mission/pillar-update")) {
      const payload = await request.json() as any;
      if (payload.gateCleared) {
        this.missionState.five_pillars_verified = true;
        await this.state.storage.put('missionData', this.missionState);
        this.broadcastState();
      }
      return Response.json({ success: true });
    }

    // ICC Sends Quote to Client Portal
    if (url.pathname.endsWith("/quote/send")) {
      const quoteData = await request.json() as any;
      // quoteData includes details from operators (plane availability, repositioning costs)
      this.missionState.quote = quoteData;
      this.missionState.status = 'QUOTE_RECEIVED';
      await this.state.storage.put('missionData', this.missionState);
      this.broadcastState();

      // Notify Client Portal via DO
      if (this.env.MISSION_DO && this.missionId) {
        const clientDoId = this.env.MISSION_DO.idFromName(this.missionId);
        const clientStub = this.env.MISSION_DO.get(clientDoId);
        await clientStub.fetch(`https://client/mission/quote-update`, {
          method: "POST",
          body: JSON.stringify(quoteData)
        });
      }

      await this.notifyViaComms("QUOTE_SENT", quoteData);

      return Response.json({ success: true, state: this.missionState });
    }

    // ICC Confirms Payment received properly
    if (url.pathname.endsWith("/payment/confirm")) {
      this.missionState.escrow_status = 'SECURED_AND_ALLOCATED';
      this.missionState.status = 'ACTIVATED';
      await this.state.storage.put('missionData', this.missionState);
      this.broadcastState();

      // Trigger Dispatch to Operators
      await this.triggerORMDispatch();
      
      // Notify Client Portal
      if (this.env.MISSION_DO && this.missionId) {
        const clientDoId = this.env.MISSION_DO.idFromName(this.missionId);
        const clientStub = this.env.MISSION_DO.get(clientDoId);
        await clientStub.fetch(`https://client/mission/payment/verified`, { method: "POST" });
      }

      await this.notifyViaComms("PAYMENT_CONFIRMED", { status: 'SECURED_AND_ALLOCATED' });
      return Response.json({ success: true });
    }

    return new Response("ICCPortalDO Active", { status: 200 });
  }

  private async notifyViaComms(eventType: string, metadata: any) {
    // Notify via CommsAPI Worker
    const commsUrl = "https://localhost/api/comms/send";
    // For local or direct DO-to-Router we would extract it or just call the function directly,
    // but in DO it's common to use fetch to the public worker URL or just bind the Comms API class.
    // Assuming a deployed worker URL here for demonstration:
  }

  private async triggerORMDispatch() {
     // Broadcast mission request to eligible operators via ORM dispatch logic.
     // In a real system, we select FIT operators from the region.
     // Because this is the edge, we might just query Supabase for applicable operators.
     if (!this.missionState) return;

     // Derive mission region (e.g. from departure_airport or a mapping, for now using a default or inferred region)
     const missionRegion = this.missionState.departure_airport || 'West Africa';

     const { data: operators } = await this.supabase
       .from('operators')
       .select('id, contact_email')
       .eq('compliance_status', 'FIT')
       .eq('operational_region', missionRegion)
       .limit(4);
     
     if (operators) {
        for (const op of operators) {
           // Provide mission details 
           // In actual application, we notify the operator DO to mark mission as 'DISPATCHED' to them
           if (this.env.OPERATOR_DO) {
              const opDoId = this.env.OPERATOR_DO.idFromName(op.id);
              const opStub = this.env.OPERATOR_DO.get(opDoId);
              opStub.fetch(`https://operator/mission-dispatch`, {
                 method: 'POST',
                 body: JSON.stringify({ missionId: this.missionId, missionData: this.missionState })
              }).catch(e => console.error(e));
           }
        }
     }
  }

  private async loadState() {
    if (!this.missionId) return;
    const { data } = await this.supabase
      .from('missions')
      .select('*')
      .eq('id', this.missionId)
      .single();
    
    if (data) {
      this.missionState = data;
      this.broadcastState();
    }
  }

  private handleWebSocket(server: WebSocket) {
    server.accept();
    this.connections.add(server);
    if (this.missionState) {
      server.send(JSON.stringify({ type: 'SYNC', state: this.missionState }));
    }

    server.addEventListener("close", () => {
      this.connections.delete(server);
    });
  }

  private broadcastState() {
    const payload = JSON.stringify({ type: 'SYNC', state: this.missionState });
    for (const ws of this.connections) {
      try { ws.send(payload); } catch (e) { this.connections.delete(ws); }
    }
  }

  /**
   * Customization Complexity Index (CCI) Calculator.
   * Classifies operational complexity to align expectations and resources.
   * CCI-0: Standard Flight
   * CCI-1: Light Tailoring
   * CCI-2: Operational Tailoring
   * CCI-3: Critical Support
   * CCI-X: Exceptional Requests
   */
  private calculateCCI(requestParams: any): string {
    if (requestParams.exceedsSafetyStandard) return 'CCI-X';
    if (requestParams.medicalMonitoring || requestParams.specialOverflight) return 'CCI-3';
    if (requestParams.allergyCoordination || requestParams.rampTransport) return 'CCI-2';
    if (requestParams.fineBeverage || requestParams.specificCabinAmbiance) return 'CCI-1';
    return 'CCI-0'; 
  }

  /**
   * Operator Code & Activation Tiers
   * TIER 1: SOFT HOLD, TIER 2: WARM ACTIVATION, TIER 3: FULL ACTIVATION
   */
  private async transitionActivationTier(targetTier: 'TIER_1' | 'TIER_2' | 'TIER_3') {
    if (!this.missionState) return { success: false, reason: "No active mission" };

    if (targetTier === 'TIER_3') {
        // According to section 5.1: 100% of the operator's payout must be deposited and locked
        const capitalSecured = this.missionState.escrow_status === 'SECURED_AND_ALLOCATED';
        if (!capitalSecured) return { success: false, reason: "Capital not verified in escrow for TIER_3." };
    }

    this.missionState.activation_tier = targetTier;
    await this.state.storage.put('missionData', this.missionState);
    
    // Sec 5.2: Automatically trigger phased disbursements based on tier
    if (targetTier === 'TIER_2') {
      await this.executePhasedDisbursement('MOBILIZATION_PHASE');
    }

    this.broadcastState();
    
    // Persist to Database
    await this.supabase.from('missions')
      .update({ activation_tier: targetTier })
      .eq('id', this.missionId);

    return { success: true, tier: targetTier };
  }

  /**
   * Supportive Phased Disbursements linked to Tiers and Verification Gates (Sec 5.2).
   */
  private async executePhasedDisbursement(phase: 'MOBILIZATION_PHASE' | 'PRE_DEPARTURE_FUEL' | 'FINAL_BALANCE') {
    // Escrow logic interacting with tier-1 banking networks securely
    if (!this.missionState || this.missionState.escrow_status !== 'SECURED_AND_ALLOCATED') return false;

    // Track successful disbursements
    const disbursements = this.missionState.disbursements || [];
    if (disbursements.includes(phase)) return true; // prevent duplicate payout

    disbursements.push(phase);
    this.missionState.disbursements = disbursements;
    await this.state.storage.put('missionData', this.missionState);
    this.broadcastState();

    // Call banking API to release funds to operator wallet...
    // (mock implementation for edge database purposes)
    return true;
  }

  /**
   * Evaluate ORM Proposals based on ICC Supremacy logic.
   * If an operator submits regional eligibility, the ICC has final authority to map the route and assign the mission.
   */
  private async handleORMProposal(proposal: any) {
    // If the mission isn't matched yet, accept the highest compliant operator from the region
    if (!this.missionState.operator_id && proposal.complianceScore >= 85) { // Assuming 85 is the fit threshold
      this.missionState.operator_id = proposal.operatorId;
      await this.state.storage.put('missionData', this.missionState);
      this.broadcastState();
      
      await this.supabase.from('missions')
        .update({ operator_id: proposal.operatorId, status: 'ACTIVATED' }) // Pivot to Active
        .eq('id', this.missionId);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/icc\/([^\/]+)/);
    if (idMatch) {
      const id = env.ICC_DO.idFromName(idMatch[1]);
      return env.ICC_DO.get(id).fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};
