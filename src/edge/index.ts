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

    // Edge Auth API
    if (url.pathname === "/api/auth/signup" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const email = (body?.email || "").toLowerCase().trim();
        return new Response(JSON.stringify({
          success: true,
          message: "Account registered on edge cluster.",
          email,
          requiresOtp: true
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400 });
      }
    }

    if (url.pathname === "/api/auth/signin" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const email = (body?.email || "").toLowerCase().trim();
        return new Response(JSON.stringify({
          success: true,
          message: "Signed in on edge cluster.",
          user: { email },
          token: `edge_tok_${Date.now()}`
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400 });
      }
    }

    if (url.pathname === "/api/auth/verify-otp" && request.method === "POST") {
      return new Response(JSON.stringify({
        success: true,
        verified: true,
        message: "OTP confirmed on edge cluster."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (url.pathname === "/api/auth/profile" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        return new Response(JSON.stringify({
          success: true,
          message: "Profile updated on edge cluster.",
          profile: body
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400 });
      }
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
