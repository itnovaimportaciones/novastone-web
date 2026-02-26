import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const ALLOWED_TEST_EMAILS = ['manuzeolite@gmail.com'];
const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const offsetMs = -3 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(local.getDate())}/${pad(local.getMonth() + 1)}/${local.getFullYear()} ${pad(
    local.getHours()
  )}:${pad(local.getMinutes())}`;
};

Deno.serve(async (req) => {
  console.log('REQ METHOD', req.method, req.url);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  console.log('FUNCTION STARTED');
  console.log('HEADERS', Object.fromEntries(req.headers.entries()));

  try {
    if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    console.log('NON-OPTIONS HIT');
    const contentType = req.headers.get('content-type') || '';
    console.log('CT', contentType);
    console.log('CL', req.headers.get('content-length'));
    if (!contentType.toLowerCase().includes('application/json')) {
      return jsonResponse({ ok: false, error: 'Content-Type must be application/json' }, 400);
    }
    const raw = await req.text();
    console.log('RAW BODY', raw);

    let body: Record<string, unknown> = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('JSON PARSE ERROR', e);
      return jsonResponse({ ok: false, error: 'Invalid JSON body', raw }, 400);
    }
    console.log('PAYLOAD', body);
    const {
      type,
      to,
      email,
      model,
      thickness,
      expires_at,
      product_code,
      reservation_id,
      inventory_id,
      test_secret
    } = body || {};

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
    const RESERVATION_EMAIL_FROM =
      Deno.env.get('RESERVATION_EMAIL_FROM') ?? 'Novastone <onboarding@resend.dev>';
    const RESERVATION_EMAIL_SUBJECT =
      Deno.env.get('RESERVATION_EMAIL_SUBJECT') ??
      '✅ Reserva confirmada por 24 hs — Novastone';
    const TEST_SECRET = Deno.env.get('TEST_SECRET') ?? '';
    console.log('HAS RESEND KEY', !!RESEND_API_KEY);

    if (!RESEND_API_KEY || !RESERVATION_EMAIL_FROM) {
      return jsonResponse({ ok: false, error: 'Missing email env vars' }, 500);
    }

    const isTest = type === 'test';
    const authHeader = req.headers.get('authorization') || '';
    const requiredFields = isTest ? ['to', 'test_secret'] : ['email', 'model', 'expires_at'];
    const missing = requiredFields.filter((field) => {
      const value = body[field];
      return typeof value !== 'string' || !value.trim();
    });
    if (missing.length > 0) {
      return jsonResponse(
        { ok: false, error: 'Missing fields', missing, received: Object.keys(body || {}) },
        400
      );
    }
    const targetEmail = String(isTest ? to : email).trim();
    const modelFull = String(model || (isTest ? 'TEST' : '')).trim();
    const thicknessValue = String(thickness || '').trim();
    const productCodeValue = String(product_code || '').trim();
    const expiresAtIso = String(
      expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    ).trim();
    const reservationId = String(
      reservation_id || (isTest ? `TEST-${Date.now()}` : '')
    ).trim();

    if (isTest) {
      if (!TEST_SECRET) {
        return jsonResponse({ ok: false, error: 'Missing TEST_SECRET in function env' }, 500);
      }
      if (String(test_secret || '').trim() !== TEST_SECRET) {
        return jsonResponse({ ok: false, error: 'Invalid test_secret' }, 401);
      }
      if (targetEmail.toLowerCase() !== 'manuzeolite@gmail.com') {
        return jsonResponse(
          {
            ok: false,
            error: 'Test email no autorizado',
            allowed: ALLOWED_TEST_EMAILS
          },
          403
        );
      }
    } else if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ ok: false, error: 'Missing Authorization' }, 401);
    }
    console.log('CREATING RESEND CLIENT');
    const resend = new Resend(RESEND_API_KEY);

    const expiresAt = formatDate(expiresAtIso);
    const subject = isTest
      ? `🧪 Test email Novastone — ${modelFull}`
      : RESERVATION_EMAIL_SUBJECT;

    const text = [
      isTest ? 'Email de prueba Novastone' : 'Reserva confirmada',
      '',
      `Modelo: ${modelFull}`,
      `Espesor: ${thicknessValue || '-'}`,
      `Codigo: ${productCodeValue || '-'}`,
      `Inventory ID: ${inventory_id || '-'}`,
      `Vence: ${expiresAt}`,
      '',
      'Gracias por confiar en Novastone.'
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">${isTest ? 'Email de prueba Novastone' : 'Reserva confirmada'}</h2>
        <p style="margin: 0 0 12px;">Estos son los datos de tu reserva:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr><td style="padding: 6px 0;"><strong>Modelo</strong></td><td style="padding: 6px 0;">${modelFull}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Espesor</strong></td><td style="padding: 6px 0;">${thicknessValue || '-'}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Codigo</strong></td><td style="padding: 6px 0;">${productCodeValue || '-'}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Inventory ID</strong></td><td style="padding: 6px 0;">${inventory_id || '-'}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Vence</strong></td><td style="padding: 6px 0;">${expiresAt}</td></tr>
        </table>
        <p style="margin: 0;">Gracias por confiar en Novastone.</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: RESERVATION_EMAIL_FROM,
      to: targetEmail,
      subject,
      html,
      text,
      tags: reservationId ? [{ name: 'reservation_id', value: reservationId }] : []
    });

    console.log('RESEND RESULT', result);

    if (result.error) {
      return jsonResponse({ ok: false, error: result.error.message }, 500);
    }

    return jsonResponse({ ok: true, mode: isTest ? 'test' : 'live' }, 200);
  } catch (error) {
    console.error('EDGE ERROR', error?.stack || error);
    return jsonResponse({ ok: false, error: String(error?.message || error) }, 500);
  }
});
