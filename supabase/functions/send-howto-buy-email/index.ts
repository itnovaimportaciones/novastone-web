import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const readEnv = (key: string) =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key] ??
  Deno.env.get(key) ??
  "";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  console.log("send-howto-buy-email REQUEST", {
    method: req.method,
    url: req.url,
  });

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const receivedSecret = req.headers.get("x-internal-secret") ?? "";
    const expectedSecret = readEnv("INTERNAL_EMAIL_SECRET");
    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const resendApiKey = readEnv("RESEND_API_KEY");
    const toEmail = readEnv("HOWTOBUY_EMAIL_TO") || "nova.grupoarg@gmail.com";
    const fromEmail =
      readEnv("HOWTOBUY_EMAIL_FROM") ||
      readEnv("RESEND_FROM") ||
      "NOVASTONE <no-reply@novastone.app>";

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const body = await req.json().catch(() => ({}));
    console.log("send-howto-buy-email BODY", body);

    const name = String(body?.name ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const role = String(body?.role ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const cuit = String(body?.cuit ?? "").trim();
    const city = String(body?.city ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !company || !role || !email || !cuit || !city) {
      return jsonResponse(
        {
          ok: false,
          error: "Missing required fields",
          required: ["name", "company", "role", "email", "cuit", "city"],
        },
        400,
      );
    }

    const subject =
      "Nueva solicitud desde /como-comprar - Marmolerias Asociadas";
    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <h2 style="margin:0 0 16px;">Nueva solicitud desde /como-comprar - Marmolerias Asociadas</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
          <tr><td style="padding: 6px 0; color:#555;">Nombre y apellido</td><td style="padding: 6px 0;"><strong>${name}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">Empresa</td><td style="padding: 6px 0;"><strong>${company}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">Rol</td><td style="padding: 6px 0;"><strong>${role}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">Email</td><td style="padding: 6px 0;"><strong>${email}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">Telefono</td><td style="padding: 6px 0;"><strong>${phone || "-"}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">CUIT</td><td style="padding: 6px 0;"><strong>${cuit}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">Ciudad / Provincia</td><td style="padding: 6px 0;"><strong>${city}</strong></td></tr>
          <tr><td style="padding: 6px 0; color:#555;">Mensaje</td><td style="padding: 6px 0;"><strong>${message || "-"}</strong></td></tr>
        </table>
      </div>
    `;
    const text = [
      "Nueva solicitud desde /como-comprar - Marmolerias Asociadas",
      "",
      `Nombre y apellido: ${name}`,
      `Empresa: ${company}`,
      `Rol: ${role}`,
      `Email: ${email}`,
      `Telefono: ${phone || "-"}`,
      `CUIT: ${cuit}`,
      `Ciudad / Provincia: ${city}`,
      `Mensaje: ${message || "-"}`,
    ].join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
        text,
      }),
    });

    const resendResult = await resendResponse.json().catch(() => ({}));
    console.log("send-howto-buy-email RESEND_RESPONSE", {
      status: resendResponse.status,
      body: resendResult,
    });

    if (!resendResponse.ok) {
      throw new Error(`Resend API error (${resendResponse.status})`);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-howto-buy-email ERROR", error);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
