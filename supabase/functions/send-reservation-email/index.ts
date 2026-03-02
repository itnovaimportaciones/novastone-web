import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const FROM = Deno.env.get("RESERVATION_EMAIL_FROM") ?? Deno.env.get("RESEND_FROM") ?? "";
    const INTERNAL_BCC = "nova.grupoarg@gmail.com";
    console.log("HEADERS:", {
      origin: req.headers.get("origin"),
      hasAuthorization: !!req.headers.get("authorization"),
    });
    console.log("ENV:", {
      hasResend: !!Deno.env.get("RESEND_API_KEY"),
      from: Deno.env.get("RESERVATION_EMAIL_FROM") || Deno.env.get("RESEND_FROM"),
    });

    if (!RESEND_API_KEY) return json(500, { ok: false, error: "Missing RESEND_API_KEY env" });
    if (!FROM) return json(500, { ok: false, error: "Missing RESERVATION_EMAIL_FROM / RESEND_FROM env" });

    const payload = await req.json().catch(() => ({}));
    console.log("PAYLOAD", {
      email: payload?.email ?? payload?.to ?? payload?.user_email ?? null,
      reservation_id: payload?.reservation_id ?? null,
      expires_at: payload?.expires_at ?? payload?.expiresAt ?? null,
      model: payload?.model ?? payload?.displayName ?? payload?.product_name ?? null,
      thickness: payload?.thickness ?? null,
      product_code: payload?.product_code ?? payload?.code ?? null,
    });

    const email = payload?.email ?? payload?.to ?? payload?.user_email ?? "";
    const reservationId = payload?.reservation_id ?? "";
    const expiresAt = payload?.expires_at ?? payload?.expiresAt ?? "";
    const model = payload?.model ?? payload?.displayName ?? payload?.product_name ?? "Modelo sin nombre";
    const thickness = payload?.thickness ?? "";
    const productCode = payload?.product_code ?? payload?.code ?? "";

    if (!email || !reservationId || !expiresAt) {
      return json(400, {
        ok: false,
        error: "missing required fields",
        got: Object.keys(payload ?? {}),
      });
    }

    const subject = `Reserva confirmada – ${model}${productCode ? ` (${productCode})` : ""}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.4">
        <h2 style="margin:0 0 12px 0">Reserva confirmada</h2>
        <p style="margin:0 0 10px 0">
          Tu reserva quedó registrada por <b>24 horas</b>.
        </p>
        <table style="border-collapse: collapse; width: 100%; max-width: 560px">
          <tr><td style="padding:6px 0; color:#666">Modelo</td><td style="padding:6px 0"><b>${model}</b></td></tr>
          <tr><td style="padding:6px 0; color:#666">Reserva</td><td style="padding:6px 0"><b>${reservationId}</b></td></tr>
          ${productCode ? `<tr><td style="padding:6px 0; color:#666">Código</td><td style="padding:6px 0"><b>${productCode}</b></td></tr>` : ""}
          ${thickness ? `<tr><td style="padding:6px 0; color:#666">Espesor</td><td style="padding:6px 0"><b>${thickness}</b></td></tr>` : ""}
          ${expiresAt ? `<tr><td style="padding:6px 0; color:#666">Vence</td><td style="padding:6px 0"><b>${expiresAt}</b></td></tr>` : ""}
        </table>
        <p style="margin:16px 0 0 0; color:#666">
          Si necesitás ayuda, respondé este mail.
        </p>
      </div>
    `.trim();

    const resendPayload = {
      from: FROM,
      to: email,
      bcc: INTERNAL_BCC,
      subject,
      html,
    };
    console.log("RESEND PAYLOAD", {
      to: email,
      reservation_id: reservationId,
      model,
      thickness,
      product_code: productCode || null,
    });

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendJson = await resendResp.json().catch(() => ({}));

    if (!resendResp.ok) {
      console.error("RESEND ERROR", resendJson);
      return json(500, { ok: false, error: resendJson });
    }

    return json(200, { ok: true });
  } catch (err) {
    return json(500, { ok: false, error: String(err) });
  }
});
