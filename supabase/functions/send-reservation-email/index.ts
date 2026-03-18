import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
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
    console.log("send-reservation-email:start");

    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    console.log("hasAuthHeader", !!req.headers.get("Authorization"));
    const INTERNAL_EMAIL_SECRET = Deno.env.get("INTERNAL_EMAIL_SECRET");
    if (!INTERNAL_EMAIL_SECRET) {
      return json(500, { ok: false, error: "Missing INTERNAL_EMAIL_SECRET" });
    }

    const secret = req.headers.get("x-internal-secret") ?? "";
    if (secret !== INTERNAL_EMAIL_SECRET) {
      console.error("Unauthorized: bad internal secret");
      return json(401, { ok: false, error: "Unauthorized" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseAnonKey) {
      return json(500, { ok: false, error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY env" });
    }
    if (!supabaseServiceRoleKey) {
      return json(500, { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
      console.error("Unauthorized: auth.getUser failed", authError?.message ?? "missing user");
      return json(401, { ok: false, error: "Unauthorized" });
    }
    const user = authData.user;
    console.log("userEmail", user?.email ?? null);
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESERVATION_EMAIL_FROM =
      Deno.env.get("RESERVATION_EMAIL_FROM") ?? Deno.env.get("RESEND_FROM");
    const INTERNAL_BCC = "nova.grupoarg@gmail.com";

    if (!RESEND_API_KEY) {
      return json(500, { ok: false, error: "Missing RESEND_API_KEY" });
    }

    if (!RESERVATION_EMAIL_FROM) {
      return json(500, { ok: false, error: "Missing RESERVATION_EMAIL_FROM" });
    }
    console.log("mailFrom", RESERVATION_EMAIL_FROM ?? null);

    const body = await req.json().catch(() => ({}));
    console.log("send-reservation-email payload keys", Object.keys(body ?? {}));

    const email = body?.email ?? body?.to ?? body?.user_email ?? "";
    const reservationId = body?.reservation_id ?? "";
    const expiresAt = body?.expires_at ?? body?.expiresAt ?? "";
    const model = body?.model ?? body?.displayName ?? body?.product_name ?? "Modelo sin nombre";
    const thickness = body?.thickness ?? "";
    const productCode = body?.product_code ?? body?.code ?? "";

    if (!email || !reservationId || !expiresAt) {
      return json(400, {
        ok: false,
        error: "missing required fields",
        got: Object.keys(body ?? {}),
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
      from: RESERVATION_EMAIL_FROM,
      to: email,
      bcc: INTERNAL_BCC,
      subject,
      html,
    };

    console.log("send-reservation-email:before-resend");
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendJson = await resendResp.json().catch(() => ({}));
    console.log("Resend response status", resendResp.status, resendJson);

    if (!resendResp.ok) {
      console.error("send-reservation-email:resend-error", resendJson);
      const queuePayload = {
        reservation_id: reservationId || null,
        payload: body,
        error: JSON.stringify(resendJson),
        status: "pending",
        retries: 0,
      };
      const { error: queueError } = await adminClient
        .from("reservation_email_queue")
        .insert(queuePayload);
      if (queueError) {
        console.error("send-reservation-email:queue-insert-error", queueError);
        return json(500, { ok: false, error: resendJson, queueError: queueError.message });
      }
      console.log("send-reservation-email:queued-for-retry", {
        reservationId: reservationId || null,
      });
      return json(202, { ok: true, queued: true });
    }

    console.log("send-reservation-email:success");
    return json(200, { ok: true });
  } catch (error) {
    console.error("FUNCTION ERROR", error);
    return json(500, { ok: false, error: String(error) });
  }
});
