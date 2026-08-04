import { MissionPortalDO } from './ClientPortalDO';
import { OperatorPortalDO } from './OperatorPortalDO';
import { ICCPortalDO } from './ICCPortalDO';
import { handleCommsAPI } from './CommsAPI';
import { DocumentProcessorDO } from './DocumentProcessorDO';
import { MissionClockDO } from './MissionClockDO';
import { PricingEngineDO } from './PricingEngineDO';

// 1. Export the Durable Object classes so Cloudflare can bind to them
export { MissionPortalDO, OperatorPortalDO, ICCPortalDO, DocumentProcessorDO, MissionClockDO, PricingEngineDO };

export interface Env {
  ASSETS: any; // Fetcher
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MISSION_DO: DurableObjectNamespace;
  OPERATOR_DO: DurableObjectNamespace;
  ICC_DO: DurableObjectNamespace;
  DOCUMENT_DO: DurableObjectNamespace;
  CLOCK_DO: DurableObjectNamespace;
  PRICE_DO: DurableObjectNamespace;
  OPERATOR_DOCS: R2Bucket;
  MISSION_DOCS: R2Bucket;
  GAS_WEBHOOK_URL: string;
  AI: any;
}

// 2. The main Edge Router (API Gateway & Asset Controller)
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Provide CORS headers for frontend uploads and options preflights
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
      });
    }

    //
    // AI Customization helper
    //
    if (url.pathname === "/api/ai/generate-customization" && request.method === "POST") {
      try {
        const payload = await request.json() as any;
        const cciLevel = payload.cciLevel;
        const currentDetails = payload.currentDetails;

        const prompt = `You are a luxury aviation concierge for 15D Wings. The client has chosen CCI Level ${cciLevel}. 
Current details: ${currentDetails}.
Generate a beautiful, succinct, and ultra-luxurious bespoke requirement list in 2-3 sentences max. Frame it as premium flight instructions.`;

        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
                { role: "system", content: "You are an elite aviation concierge." },
                { role: "user", content: prompt }
            ]
        });

        return new Response(JSON.stringify({ result: response.response }), {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*" 
            }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" }});
      }
    }

    //
    // Document API - Upload and Verification Router
    //
    if (url.pathname === "/api/documents/upload" && request.method === "POST") {
      const id = env.DOCUMENT_DO.idFromName("doc_processor");
      const stub = env.DOCUMENT_DO.get(id);
      return stub.fetch(request);
    }

    //
    // Comms API (e.g., Gas Mailer)
    //
    if (url.pathname === "/api/comms/send" && request.method === "POST") {
      return handleCommsAPI(request, env);
    }

    //
    // Clock API - Mission timers and countdown clocks
    //
    if (url.pathname.startsWith("/api/clock/")) {
      const match = url.pathname.match(/\/api\/clock\/([^/]+)/);
      if (match) {
        const id = env.CLOCK_DO.idFromName(match[1]);
        return env.CLOCK_DO.get(id).fetch(request);
      }
    }

    //
    // Pricing API - Operational quotes and pivot evaluations
    //
    if (url.pathname.startsWith("/api/price/") || url.pathname.startsWith("/api/pricing/")) {
      const match = url.pathname.match(/\/(?:api\/price|api\/pricing)\/([^/]+)/);
      if (match) {
        const id = env.PRICE_DO.idFromName(match[1]);
        return env.PRICE_DO.get(id).fetch(request);
      }
    }

    //
    // Mission Portal - Handles client requests, onboarding, and itinerary transitions
    // Supports both old /client/mission/ and new /api/mission/ prefix for full compatibility
    //
    if (url.pathname.startsWith("/api/mission/") || url.pathname.startsWith("/client/mission/")) {
      const match = url.pathname.match(/\/(?:api\/mission|client\/mission)\/([^/]+)/);
      if (match) {
        const id = env.MISSION_DO.idFromName(match[1]);
        return env.MISSION_DO.get(id).fetch(request);
      }
    }

    //
    // Operator Portal - Handles ground handler state updates and verifications
    //
    if (url.pathname.startsWith("/api/operator/") || url.pathname.startsWith("/operator/")) {
      const match = url.pathname.match(/\/(?:api\/operator|operator)\/([^/]+)/);
      if (match) {
        const id = env.OPERATOR_DO.idFromName(match[1]);
        return env.OPERATOR_DO.get(id).fetch(request);
      }
    }

    //
    // ICC Portal - Command oversight, approvals, and dispatch triggers
    //
    if (url.pathname.startsWith("/api/icc/") || url.pathname.startsWith("/icc/")) {
      const match = url.pathname.match(/\/(?:api\/icc|icc)\/([^/]+)/);
      if (match) {
        const id = env.ICC_DO.idFromName(match[1]);
        return env.ICC_DO.get(id).fetch(request);
      }
    }

    //
    // Base Health Check
    //
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ 
        status: "15D Wings Edge Cluster Active",
        version: "1.0",
        components: ["ClientPortalDO", "OperatorPortalDO", "ICCPortalDO", "DocumentAPI", "CommsAPI"]
      }), { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      });
    }

    //
    // Everything else - serve static React Assets built inside the /dist folder
    // This allows the Worker to act as the single-origin unified gateway
    //
    return env.ASSETS.fetch(request);
  }
};
