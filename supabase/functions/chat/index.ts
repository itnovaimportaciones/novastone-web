import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://novastone.app",
  "https://www.novastone.app",
];

const SYSTEM_PROMPT =
  "Sos el asistente virtual de NOVASTONE, empresa argentina de piedra sinterizada premium. Vendemos superficies en 12mm y 20mm con acabados Full Body, Espejada y Luxury. Aplicaciones: cocinas, baños, fachadas y proyectos comerciales. Si te preguntan por precios o stock específico, decí que un asesor va a confirmar y ofrecé el WhatsApp. Respondé siempre en español, de forma profesional pero cercana. Nunca inventes información.";

const readEnv = (key: string) =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.[key] ??
  Deno.env.get(key) ??
  "";

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith("http://localhost:");

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://novastone.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  const jsonResponse = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const anthropicKey = readEnv("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const body = await req.json().catch(() => ({}));
    const messages: { role: string; content: string }[] =
      body?.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse(
        { ok: false, error: "messages array is required" },
        400
      );
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic error (${anthropicRes.status}): ${errText}`);
    }

    const data = await anthropicRes.json();
    const reply = data?.content?.[0]?.text ?? "";

    return jsonResponse({ ok: true, reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("chat ERROR", error);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
