export class ChatDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname.endsWith("/messages") && request.method === "GET") {
      const messages = (await this.state.storage.get("messages")) || [];
      return new Response(JSON.stringify({ ok: true, messages }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname.endsWith("/send") && request.method === "POST") {
      const body = (await request.json()) as any;
      const messages: any[] = (await this.state.storage.get("messages")) || [];
      const newMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender_id: body.sender_id || "ANONYMOUS",
        sender_role: body.sender_role || "USER",
        message: body.message || "",
        created_at: new Date().toISOString(),
      };
      messages.push(newMsg);
      await this.state.storage.put("messages", messages);
      return new Response(JSON.stringify({ ok: true, message: newMsg }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(
      JSON.stringify({
        status: "15D Wings Chat Durable Object Operational",
        active: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
