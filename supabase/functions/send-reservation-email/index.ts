import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@5.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? "https://xlyddqkksdafjhnsznlv.supabase.co";
const issuer = `${supabaseUrl}/auth/v1`;
const jwksUrl = `${issuer}/.well-known/jwks.json`;
const jwks = createRemoteJWKSet(new URL(jwksUrl));

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySupabaseJwt(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false as const,
      response: json(401, { code: 401, message: "Missing Authorization" }),
    };
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const verified = await jwtVerify(token, jwks, {
      issuer,
      audience: "authenticated",
    });
    console.log("JWT VERIFIED", {
      issuer,
      jwksUrl,
      aud: verified.payload.aud ?? null,
      exp: verified.payload.exp ?? null,
      email: verified.payload.email ?? null,
    });
    return { ok: true as const, payload: verified.payload };
  } catch (audienceError) {
    console.warn("JWT VERIFY audience failed", audienceError);
    try {
      const verified = await jwtVerify(token, jwks, { issuer });
      console.log("JWT VERIFIED (without audience)", {
        issuer,
        jwksUrl,
        aud: verified.payload.aud ?? null,
        exp: verified.payload.exp ?? null,
        email: verified.payload.email ?? null,
      });
      return { ok: true as const, payload: verified.payload };
    } catch (error) {
      console.error("JWT VERIFY ERROR", error);
      return {
        ok: false as const,
        response: json(401, {
          code: 401,
          message: "Invalid JWT (manual verify)",
        }),
      };
    }
  }
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const FROM = Deno.env.get("RESERVATION_EMAIL_FROM") ?? Deno.env.get("RESEND_FROM") ?? "";
    const INTERNAL_BCC = "nova.grupoarg@gmail.com";

    console.log("HEADERS", {
      origin: req.headers.get("origin"),
      hasAuthorization: !!req.headers.get("authorization"),
      issuer,
      jwksUrl,
    });
    console.log("ENV", {
      hasResend: !!RESEND_API_KEY,
      from: FROM,
    });

    if (!RESEND_API_KEY) {
      return json(500, { ok: false, error: "Missing RESEND_API_KEY env" });
    }

    if (!FROM) {
      return json(500, { ok: false, error: "Missing RESERVATION_EMAIL_FROM / RESEND_FROM env" });
    }

    const jwtResult = await verifySupabaseJwt(req.headers.get("authorization"));
    if (!jwtResult.ok) {
      return jwtResult.response;
    }

    const body = await req.json().catch(() => ({}));
    console.log("PAYLOAD", {
      email: body?.email ?? body?.to ?? body?.user_email ?? null,
      reservation_id: body?.reservation_id ?? null,
      expires_at: body?.expires_at ?? body?.expiresAt ?? null,
      model: body?.model ?? body?.displayName ?? body?.product_name ?? null,
      thickness: body?.thickness ?? null,
      product_code: body?.product_code ?? body?.code ?? null,
    });

    const email = body?.email ?? body?.to ?? body?.user_email ?? "";
    const reservationId = body?.reservation_id ?? "";
    const expiresAt = body?.expires_at ?? body?.expiresAt ?? "";
    const model = body?.model ?? body?.displayName ?? body?.product_name ?? "Modelo sin nombre";
    const thickness = body?.thickness ?? "";
    const productCode = body?.product_code ?? body?.code ?? "";
    const jwtEmail = String(jwtResult.payload.email ?? "");

    if (!email || !reservationId || !expiresAt) {
      return json(400, {
        ok: false,
        error: "missing required fields",
        got: Object.keys(body ?? {}),
      });
    }

    if (jwtEmail && email && jwtEmail !== email) {
      return json(401, {
        ok: false,
        error: "JWT email mismatch",
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
  } catch (error) {
    console.error("FUNCTION ERROR", error);
    return json(500, { ok: false, error: String(error) });
  }
});
