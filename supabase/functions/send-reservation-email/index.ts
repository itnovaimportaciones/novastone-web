import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret, test_secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const FROM = Deno.env.get("RESERVATION_EMAIL_FROM") ?? Deno.env.get("RESEND_FROM") ?? "";
    const INTERNAL_EMAIL_SECRET = Deno.env.get("INTERNAL_EMAIL_SECRET") ?? "";
    const INTERNAL_BCC = "nova.grupoarg@gmail.com";
    console.log("HEADERS:", {
      origin: req.headers.get("origin"),
      hasInternal: !!(req.headers.get("x-internal-secret") || req.headers.get("test_secret")),
    });
    console.log("ENV:", {
      hasResend: !!Deno.env.get("RESEND_API_KEY"),
      from: Deno.env.get("RESERVATION_EMAIL_FROM") || Deno.env.get("RESEND_FROM"),
    });

    if (!RESEND_API_KEY) return json(500, { ok: false, error: "Missing RESEND_API_KEY env" });
    if (!FROM) return json(500, { ok: false, error: "Missing RESERVATION_EMAIL_FROM / RESEND_FROM env" });
    if (!INTERNAL_EMAIL_SECRET) return json(500, { ok: false, error: "Missing INTERNAL_EMAIL_SECRET env" });

    const internal = req.headers.get("x-internal-secret") || req.headers.get("test_secret") || "";
    if (internal !== INTERNAL_EMAIL_SECRET) {
      return json(401, { ok: false, error: "Unauthorized" });
    }

    const body = await req.json().catch(() => ({}));

    // Soporta nombres de campos típicos (no dependemos de 1 formato)
    const to =
      body?.to ??
      body?.user_email ??
      body?.email ??
      "";

    const model =
      body?.model ??
      body?.displayName ??
      body?.product_name ??
      "Superficie reservada";

    const code =
      body?.code ??
      body?.product_code ??
      "";

    const thickness =
      body?.thickness ??
      "";

    const expiresAt =
      body?.expires_at ??
      body?.expiresAt ??
      "";

    if (!to || typeof to !== "string") {
      return json(400, { ok: false, error: "Missing recipient email (to/user_email/email)" });
    }

    // ✅ ACÁ va tu “estructura de mail” (si ya la tenían, reemplazar este HTML por el que acordaron)
    const subject = `Reserva confirmada – ${model}${code ? ` (${code})` : ""}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.4">
        <h2 style="margin:0 0 12px 0">Reserva confirmada</h2>
        <p style="margin:0 0 10px 0">
          Tu reserva quedó registrada por <b>24 horas</b>.
        </p>
        <table style="border-collapse: collapse; width: 100%; max-width: 560px">
          <tr><td style="padding:6px 0; color:#666">Modelo</td><td style="padding:6px 0"><b>${model}</b></td></tr>
          ${code ? `<tr><td style="padding:6px 0; color:#666">Código</td><td style="padding:6px 0"><b>${code}</b></td></tr>` : ""}
          ${thickness ? `<tr><td style="padding:6px 0; color:#666">Espesor</td><td style="padding:6px 0"><b>${thickness}</b></td></tr>` : ""}
          ${expiresAt ? `<tr><td style="padding:6px 0; color:#666">Vence</td><td style="padding:6px 0"><b>${expiresAt}</b></td></tr>` : ""}
        </table>
        <p style="margin:16px 0 0 0; color:#666">
          Si necesitás ayuda, respondé este mail.
        </p>
      </div>
    `.trim();

    const payload = {
      from: FROM,
      to,                // cliente
      bcc: INTERNAL_BCC, // ✅ siempre copia a NOVA
      subject,
      html,
    };
    console.log("PAYLOAD:", payload);

    // Resend API
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resendJson = await resendResp.json().catch(() => ({}));

    if (!resendResp.ok) {
      return json(500, {
        ok: false,
        error: "Resend API error",
        status: resendResp.status,
        details: resendJson,
      });
    }

    return json(200, { ok: true, resend: resendJson });
  } catch (err) {
    return json(500, { ok: false, error: String(err) });
  }
});
