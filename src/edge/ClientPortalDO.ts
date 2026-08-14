/// <reference types="@cloudflare/workers-types" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MISSION_DO: DurableObjectNamespace;
}

/**
 * MissionPortalDO: A Cloudflare Durable Object that acts as an edge database
 * for the Client Portal. It handles real-time modifications, pricing, 
 * payment verification state, mission lifecycle, and flight choices.
 */
export class MissionPortalDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private supabase: SupabaseClient;
  private missionId: string | null = null;
  private connections: Set<WebSocket> = new Set();
  
  // In-memory cache representing the Edge Database state
  private missionCache: any = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    this.supabase = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Rehydrate state on startup
    this.state.blockConcurrencyWhile(async () => {
      const storedMissionId = await this.state.storage.get<string>('missionId');
      if (storedMissionId) {
        this.missionId = storedMissionId;
        await this.loadCoreData();
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Dynamic state synchronization - pull latest from Supabase if mission ID is in path
    const match = url.pathname.match(/\/client\/mission\/([^/]+)/);
    if (match && match[1] && !["init", "price-update", "pricing"].some(p => match[1].includes(p))) {
      this.missionId = match[1];
      await this.state.storage.put('missionId', this.missionId);
      await this.loadCoreData();
    } else if (this.missionId) {
      await this.loadCoreData();
    }

    // Handle WebSocket Upgrades for real-time client portal sync
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      this.handleWebSocketSession(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP API Endpoints
    if (url.pathname.endsWith("/init")) {
      const { missionId } = await request.json() as { missionId: string };
      this.missionId = missionId;
      await this.state.storage.put('missionId', missionId);
      await this.loadCoreData();
      return Response.json({ success: true, state: this.missionCache });
    }

    if (url.pathname.endsWith("/pricing/update")) {
      const { estimated_lower, estimated_upper } = await request.json() as any;
      await this.updatePricing(estimated_lower, estimated_upper);
      return Response.json({ success: true, state: this.missionCache });
    }

    if (url.pathname.endsWith("/price-update")) {
      const { platformFee, commitmentActivation, outstanding_balance, raw_payload } = await request.json() as any;
      if (this.missionCache) {
          this.missionCache.platform_fee = platformFee;
          this.missionCache.commitment_activation_fee = commitmentActivation;
          this.missionCache.outstanding_balance = outstanding_balance;
          if (raw_payload) this.missionCache.raw_payload = raw_payload;
          await this.state.storage.put('missionData', this.missionCache);
          this.broadcastState();
      }
      return Response.json({ success: true, state: this.missionCache });
    }

    if (url.pathname.endsWith("/flight/change")) {
      const { aircraftClass, legs } = await request.json() as any;
      await this.changeFlightChoice(aircraftClass, legs);
      return Response.json({ success: true, state: this.missionCache });
    }

    if (url.pathname.endsWith("/schedule/change")) {
      const updates = await request.json() as any;
      if (this.missionCache) {
          this.missionCache = { ...this.missionCache, ...updates };
          await this.state.storage.put('missionData', this.missionCache);
          this.broadcastState();
      }
      return Response.json({ success: true, state: this.missionCache });
    }

    if (url.pathname.endsWith("/payment/verify")) {
      const { paymentId, status } = await request.json() as any;
      await this.verifyPayment(paymentId, status);
      return Response.json({ success: true, state: this.missionCache });
    }

    if (url.pathname.endsWith("/lifecycle/advance")) {
      const { status } = await request.json() as { status: string };
      await this.advanceLifecycle(status);
      return Response.json({ success: true, state: this.missionCache });
    }

    // Accept Quote from ICC
    if (url.pathname.endsWith("/quote-update")) {
      const quoteData = await request.json() as any;
      if (this.missionCache) {
        this.missionCache.quote = quoteData;
        this.missionCache.status = 'QUOTE_RECEIVED';
        await this.state.storage.put('missionData', this.missionCache);
        this.broadcastState();
      }
      return Response.json({ success: true, state: this.missionCache });
    }

    // Accept Client Payment submission
    if (url.pathname.endsWith("/payment/submit")) {
      if (this.missionCache) {
        this.missionCache.status = 'AWAITING_PAYMENT_CONFIRMATION';
        await this.state.storage.put('missionData', this.missionCache);
        this.broadcastState();
        
        // Push status to Supabase DB for persistence
        await this.supabase.from('missions')
          .update({ status: 'AWAITING_PAYMENT_CONFIRMATION' })
          .eq('id', this.missionId);
      }
      return Response.json({ success: true, state: this.missionCache });
    }

    // Payment Verified by ICC
    if (url.pathname.endsWith("/payment/verified")) {
      if (this.missionCache) {
        this.missionCache.escrow_status = 'SECURED_AND_ALLOCATED';
        this.missionCache.status = 'ACTIVATED';
        await this.state.storage.put('missionData', this.missionCache);
        this.broadcastState();
      }
      return Response.json({ success: true, state: this.missionCache });
    }

    return new Response("MissionPortalDO running.", { status: 200 });
  }

  /**
   * Pull core data from the Supabase Database and cache it at the edge.
   */
  private async loadCoreData() {
    if (!this.missionId) return;
    
    // Fetch mission details
    const { data: mission } = await this.supabase
      .from('missions')
      .select('*, mission_customizations(*), passenger_manifest(*), payments(*), mission_aircraft(*)')
      .eq('id', this.missionId)
      .single();

    if (mission) {
      this.missionCache = mission;
      await this.state.storage.put('missionData', this.missionCache);
      this.broadcastState();
    }
  }

  /**
   * Real-time WebSocket connection handler for the dashboard.
   */
  private handleWebSocketSession(server: WebSocket) {
    server.accept();
    this.connections.add(server);
    
    // Send immediate initial sync state upon connection
    if (this.missionCache) {
      server.send(JSON.stringify({ type: 'SYNC', state: this.missionCache }));
    }

    server.addEventListener("message", async (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        
        switch (msg.type) {
          case 'UPDATE_DASHBOARD_STATE':
            // E.g. Client modifies passenger details or UI state
            if (msg.payload?.manifest) {
              await this.updatePassengerManifest(msg.payload.manifest);
            }
            break;
          case 'REQUEST_SYNC':
            server.send(JSON.stringify({ type: 'SYNC', state: this.missionCache }));
            break;
        }
      } catch (err) {
        console.error("DO WebSocket error:", err);
      }
    });

    server.addEventListener("close", () => {
      this.connections.delete(server);
    });
  }

  /**
   * Broadcast the latest edge state to all connected clients.
   */
  private broadcastState() {
    const payload = JSON.stringify({ type: 'SYNC', state: this.missionCache });
    for (const ws of this.connections) {
      try {
        ws.send(payload);
      } catch (e) {
        this.connections.delete(ws);
      }
    }
  }

  /**
   * Pricing real-time modifications.
   */
  private async updatePricing(lower: number, upper: number) {
    if (!this.missionId) return;

    this.missionCache.estimated_lower = lower;
    this.missionCache.estimated_upper = upper;
    await this.state.storage.put('missionData', this.missionCache);
    
    this.broadcastState();

    // Fire and forget to Supabase
    this.supabase.from('missions')
      .update({ estimated_lower: lower, estimated_upper: upper, version: this.missionCache.version + 1 })
      .eq('id', this.missionId)
      .then();
  }

  /**
   * Handle Flight Choice changes on the edge.
   */
  private async changeFlightChoice(aircraftClass: string, legs: any[]) {
    if (!this.missionId || this.missionCache?.is_config_locked) return;

    this.missionCache.aircraft_class = aircraftClass;
    if (legs) this.missionCache.legs = legs;

    await this.state.storage.put('missionData', this.missionCache);
    this.broadcastState();

    await this.supabase.from('missions')
      .update({ aircraft_class: aircraftClass, legs: this.missionCache.legs || [] })
      .eq('id', this.missionId);

    await this.loadCoreData();
  }

  /**
   * Handle Payment Verification.
   */
  private async verifyPayment(paymentId: string, paymentStatus: string) {
    if (!this.missionId) return;

    this.missionCache.payment_status = paymentStatus;
    if (this.missionCache.payments && Array.isArray(this.missionCache.payments)) {
      const p = this.missionCache.payments.find((p: any) => p.id === paymentId);
      if (p) p.status = paymentStatus;
    }

    await this.state.storage.put('missionData', this.missionCache);
    this.broadcastState();

    await this.supabase.from('missions')
      .update({ payment_status: paymentStatus })
      .eq('id', this.missionId);
      
    await this.supabase.from('payments')
      .update({ status: paymentStatus })
      .eq('id', paymentId);
  }

  /**
   * Mission Lifecycle progression.
   */
  private async advanceLifecycle(newStatus: string) {
    if (!this.missionId) return;

    this.missionCache.status = newStatus;
    // Lock config if progressing to operator review or confirmation
    if (['AWAITING_CONFIRMATION', 'OPERATOR_REVIEW', 'ACTIVATED'].includes(newStatus)) {
      this.missionCache.is_config_locked = true;
    }

    await this.state.storage.put('missionData', this.missionCache);
    this.broadcastState();

    this.supabase.from('missions')
      .update({ status: newStatus, is_config_locked: this.missionCache.is_config_locked })
      .eq('id', this.missionId)
      .then();
  }

  /**
   * Updates manifest data via Client Portal modifications
   */
  private async updatePassengerManifest(manifestObj: any) {
    if (!this.missionId) return;
    
    // Apply changes locally
    if (!this.missionCache.passenger_manifest) {
      this.missionCache.passenger_manifest = [];
    }
    
    const index = this.missionCache.passenger_manifest.findIndex((p: any) => p.id === manifestObj.id);
    if (index >= 0) {
      this.missionCache.passenger_manifest[index] = { ...this.missionCache.passenger_manifest[index], ...manifestObj };
    } else {
      this.missionCache.passenger_manifest.push(manifestObj);
    }
    
    await this.state.storage.put('missionData', this.missionCache);
    this.broadcastState();

    // Push to DB implicitly
    this.supabase.from('passenger_manifest')
      .upsert({ ...manifestObj, mission_id: this.missionId })
      .then();
  }
}

/**
 * Example Worker Endpoint to route requests to the Durable Object
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Extract mission ID from path, e.g. /mission/M-12345/...
    const missionIdMatch = url.pathname.match(/\/mission\/([^\/]+)/);
    
    if (missionIdMatch) {
      const missionId = missionIdMatch[1];
      // Get the DO instance specifically for this Booking ID (Edge Database mapping)
      const id = env.MISSION_DO.idFromName(missionId);
      const stub = env.MISSION_DO.get(id);

      // We might want to pass the missionId on initialization
      if (url.pathname.endsWith("/init")) {
        const clonedReq = request.clone();
        // The DO handles the init parsing
      }

      // Forward request to the Durable Object
      return stub.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
