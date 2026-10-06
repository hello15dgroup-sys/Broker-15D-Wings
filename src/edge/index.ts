import { ChatDO } from './ChatDO';
import { handleCommsAPI } from './CommsAPI';

export { ChatDO };

// Dummy classes for migration history compatibility (v1, v2, v3 deleted classes)
export class MissionPortalDO {}
export class OperatorPortalDO {}
export class ICCPortalDO {}
export class DocumentProcessorDO {}
export class MissionClockDO {}
export class PricingEngineDO {}

export interface Env {
  ASSETS: any;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CHAT_DO: DurableObjectNamespace;
  GAS_WEBHOOK_URL: string;
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
      });
    }

    // Chat API router -> ChatDO
    if (url.pathname.startsWith("/api/chat/")) {
      const match = url.pathname.match(/\/api\/chat\/([^/]+)/);
      const roomId = match ? match[1] : "global_room";
      const id = env.CHAT_DO.idFromName(roomId);
      const stub = env.CHAT_DO.get(id);
      return stub.fetch(request);
    }

    // Comms API (Premium Mail Studio)
    if (url.pathname === "/api/comms/send" && request.method === "POST") {
      return handleCommsAPI(request, env);
    }

    // Health Check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ 
        status: "15D Wings Edge Cluster Active",
        version: "2.0",
        durable_objects: ["ChatDO"]
      }), { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      });
    }

    return env.ASSETS.fetch(request);
  }
};
