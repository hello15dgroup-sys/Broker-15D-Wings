/// <reference types="@cloudflare/workers-types" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPERATOR_DO: DurableObjectNamespace;
  ICC_DO: DurableObjectNamespace;
  MISSION_DO: DurableObjectNamespace;
}

export class OperatorPortalDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private supabase: SupabaseClient;
  private operatorId: string | null = null;
  private connections: Set<WebSocket> = new Set();
  private operatorState: any = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    this.state.blockConcurrencyWhile(async () => {
      this.operatorId = await this.state.storage.get<string>('operatorId') || null;
      if (this.operatorId) await this.loadState();
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
      const { operatorId } = await request.json() as any;
      this.operatorId = operatorId;
      await this.state.storage.put('operatorId', operatorId);
      await this.loadState();
      return Response.json({ success: true, state: this.operatorState });
    }

    if (url.pathname.endsWith("/verify-gate")) {
      // Logic for operators processing the Five-Pillar verification gate
      const { missionId, pillarData } = await request.json() as any;
      const result = await this.evaluateVerificationGate(missionId, pillarData);
      return Response.json({ success: true, result });
    }

    // Handle incoming dispatch from ICC (ORM)
    if (url.pathname.endsWith("/mission-dispatch")) {
      const payload = await request.json() as any;
      // In reality, records would be kept in a "dispatched_missions" collection or queue
      // Notify the connected operator via WebSocket
      for (const ws of this.connections) {
        ws.send(JSON.stringify({ type: 'MISSION_DISPATCHED', payload }));
      }
      return Response.json({ success: true });
    }

    return new Response("OperatorPortalDO Active", { status: 200 });
  }

  private async loadState() {
    if (!this.operatorId) return;
    const { data } = await this.supabase
      .from('operators')
      .select('*')
      .eq('id', this.operatorId)
      .single();
    
    if (data) {
      this.operatorState = data;
      this.broadcastState();
    }
  }

  private handleWebSocket(server: WebSocket) {
    server.accept();
    this.connections.add(server);
    if (this.operatorState) {
      server.send(JSON.stringify({ type: 'SYNC', state: this.operatorState }));
    }

    server.addEventListener("message", async (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'REQUEST_ROTATION') {
          await this.triggerRegionalORMRotation(msg.payload.missionId, msg.payload.region);
        }
      } catch (e) {
        console.error(e);
      }
    });

    server.addEventListener("close", () => {
      this.connections.delete(server);
    });
  }

  private broadcastState() {
    const payload = JSON.stringify({ type: 'SYNC', state: this.operatorState });
    for (const ws of this.connections) {
      try { ws.send(payload); } catch (e) { this.connections.delete(ws); }
    }
  }

  /**
   * The Operator Verification Gate (Five-Pillar Integrity Standard).
   * 01. Permits, 02. Aircraft Setup, 03. Crew Readiness, 04. Fuel Assurance, 05. Capital Security
   */
  private async evaluateVerificationGate(missionId: string, pillarData: any) {
    // 1. Evaluate specific pillars submitted by the operator
    const isPermitValid = pillarData.permits?.cleared === true;
    const isAircraftReady = pillarData.aircraft?.status === 'POSITIONED';
    const isCrewReady = pillarData.crew?.dutyLegal === true;
    const isFuelSecured = pillarData.fuel?.preArranged === true;
    const isCapitalSecured = pillarData.escrow?.status === 'SECURED_AND_ALLOCATED';

    const gateCleared = isPermitValid && isAircraftReady && isCrewReady && isFuelSecured && isCapitalSecured;
    
    // 2. Notify the ICC of state change (ICC Supremacy)
    if (gateCleared && this.env.ICC_DO) {
      const iccId = this.env.ICC_DO.idFromName(missionId);
      const iccStub = this.env.ICC_DO.get(iccId);
      await iccStub.fetch(`https://icc/mission/pillar-update`, {
        method: 'POST',
        body: JSON.stringify({ missionId, operatorId: this.operatorId, gateCleared })
      });
    }

    return { gateCleared, summary: { isPermitValid, isAircraftReady, isCrewReady, isFuelSecured, isCapitalSecured } };
  }

  /**
   * ORM (Operator Rotation Mechanism) based on Region.
   * "The ORM should also rotate based on the region of operation of the operators...
   * that logic should be part and parcel of the Operators DO"
   */
  private async triggerRegionalORMRotation(missionId: string, targetRegion: string) {
    if (!this.operatorState) return;
    
    // Check if THIS operator matches the target region for the rotation
    const operatorRegion = this.operatorState.region || 'UNKNOWN';
    let rotationEligibility = false;

    // Strict validation: Must match the target region and be fully verified (FIT / MISSION_READY)
    if (operatorRegion === targetRegion && (this.operatorState.compliance_status === 'FIT' || this.operatorState.ove_state === 'MISSION_READY')) {
      rotationEligibility = true;
    }

    // Call ICC DO under ICC Supremacy to propose this operator for regional ORM assignment
    if (rotationEligibility && this.env.ICC_DO) {
      const iccId = this.env.ICC_DO.idFromName(missionId);
      const iccStub = this.env.ICC_DO.get(iccId);
      await iccStub.fetch(`https://icc/orm/propose`, {
        method: 'POST',
        body: JSON.stringify({ 
          missionId, 
          operatorId: this.operatorId, 
          region: operatorRegion,
          complianceScore: this.operatorState.compliance_score || 0
        })
      });
    }

    // Notify client side
    for (const ws of this.connections) {
      ws.send(JSON.stringify({ type: 'ROTATION_EVALUATED', eligibility: rotationEligibility, region: targetRegion }));
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/operator\/([^\/]+)/);
    if (idMatch) {
      const id = env.OPERATOR_DO.idFromName(idMatch[1]);
      return env.OPERATOR_DO.get(id).fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};
