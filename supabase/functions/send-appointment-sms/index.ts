/**
 * SMS alert to a business phone when a customer books (Twilio).
 *
 * Deploy: supabase functions deploy send-appointment-sms
 *
 * Secrets (Supabase Dashboard → Edge Functions → send-appointment-sms):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY  (auto)
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either:
 *   - TWILIO_MESSAGING_SERVICE_SID (MG…; SMS or WhatsApp senders inside Twilio), or
 *   - TWILIO_SMS_FROM (or TWILIO_PHONE_NUMBER / TWILIO_FROM_NUMBER): E.164 / short code.
 *   WhatsApp (Twilio): set TWILIO_WHATSAPP_FROM=whatsapp:+… (your WhatsApp sender) OR set
 *   TWILIO_WHATSAPP=1 with TWILIO_MESSAGING_SERVICE_SID (MG must include a WhatsApp sender).
 *   To/From use whatsapp:+E164. Meta may require approved templates for outbound alerts—see Twilio docs.
 *   Reuse the same Twilio Account SID + Auth Token as Dashboard → Authentication → Phone;
 *   those Auth secrets are not available inside Edge Functions—you set the same values here.
 *
 * If Twilio vars are missing, returns { ok: true, skipped: 'twilio_not_configured' } (no error).
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Best-effort E.164 for US-heavy app; extend as needed. */
function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith('+')) {
    const digits = t.slice(1).replace(/\D/g, '');
    return digits.length >= 10 ? `+${digits}` : null;
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

function truthyEnv(name: string): boolean {
  const v = (Deno.env.get(name) ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Twilio WhatsApp From/To must use whatsapp:+E164 (see Twilio WhatsApp console). */
function normalizeWhatsappFrom(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const rest = t.toLowerCase().startsWith('whatsapp:') ? t.slice('whatsapp:'.length).trim() : t;
  const e164 = normalizeE164(rest);
  if (!e164) return null;
  return `whatsapp:${e164}`;
}

function toWhatsappRecipient(e164: string): string {
  return e164.toLowerCase().startsWith('whatsapp:') ? e164 : `whatsapp:${e164}`;
}

type TwilioSend =
  | { sid: string; token: string; kind: 'sms_mg'; messagingServiceSid: string }
  | { sid: string; token: string; kind: 'sms_from'; from: string }
  | { sid: string; token: string; kind: 'wa_mg'; messagingServiceSid: string }
  | { sid: string; token: string; kind: 'wa_from'; from: string };

/** Messaging Service (MG…) or explicit From; optional WhatsApp addressing. */
function getTwilioSendConfig(): TwilioSend | null {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')?.trim();
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')?.trim();
  if (!sid || !token) return null;

  const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')?.trim() || '';
  const waFromRaw = Deno.env.get('TWILIO_WHATSAPP_FROM')?.trim() || '';
  const waFrom = waFromRaw ? normalizeWhatsappFrom(waFromRaw) : null;
  const useWaWithMg = truthyEnv('TWILIO_WHATSAPP') && messagingServiceSid.startsWith('MG');

  if (waFrom) {
    return { sid, token, kind: 'wa_from', from: waFrom };
  }
  if (useWaWithMg) {
    return { sid, token, kind: 'wa_mg', messagingServiceSid };
  }
  if (messagingServiceSid.startsWith('MG')) {
    return { sid, token, kind: 'sms_mg', messagingServiceSid };
  }

  const from =
    Deno.env.get('TWILIO_SMS_FROM')?.trim() ||
    Deno.env.get('TWILIO_PHONE_NUMBER')?.trim() ||
    Deno.env.get('TWILIO_FROM_NUMBER')?.trim() ||
    '';
  if (!from) return null;
  return { sid, token, kind: 'sms_from', from };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as { appointmentId?: string };
    const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId.trim() : '';
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: 'appointmentId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const twilio = getTwilioSendConfig();
    if (!twilio) {
      console.warn('[send-appointment-sms] Twilio not configured; skipping SMS');
      return new Response(JSON.stringify({ ok: true, skipped: 'twilio_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: appt, error: qerr } = await admin
      .from('appointments')
      .select('id, customer_id, date, start_time, business_id, service_id')
      .eq('id', appointmentId)
      .maybeSingle();

    if (qerr || !appt) {
      console.warn('[send-appointment-sms] appointment fetch:', qerr?.message);
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = String((appt as { customer_id?: string }).customer_id || '');
    if (customerId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const businessId = String((appt as { business_id?: string }).business_id || '');
    const serviceId = String((appt as { service_id?: string }).service_id || '');

    const [{ data: biz }, { data: svc }] = await Promise.all([
      admin.from('businesses').select('name, phone').eq('id', businessId).maybeSingle(),
      admin.from('business_services').select('name').eq('id', serviceId).maybeSingle(),
    ]);

    const rawPhone = (biz as { phone?: string | null } | null)?.phone ?? null;
    const e164 = normalizeE164(rawPhone);
    if (!e164) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_business_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const useWhatsapp = twilio.kind === 'wa_from' || twilio.kind === 'wa_mg';
    const to = useWhatsapp ? toWhatsappRecipient(e164) : e164;

    const businessName = String((biz as { name?: string } | null)?.name || 'Your business').slice(0, 80);
    const serviceName = String((svc as { name?: string } | null)?.name || 'Service').slice(0, 80);
    const dateStr = String((appt as { date?: string }).date || '');
    const timeStr = String((appt as { start_time?: string }).start_time || '');
    const smsBody =
      `Intera: New booking at ${businessName}. ${serviceName} on ${dateStr} at ${timeStr}. Open the Intera app to manage appointments.`.slice(
        0,
        1500
      );

    const basicAuth = btoa(`${twilio.sid}:${twilio.token}`);
    const params = new URLSearchParams({ To: to, Body: smsBody });
    if (twilio.kind === 'sms_mg' || twilio.kind === 'wa_mg') {
      params.set('MessagingServiceSid', twilio.messagingServiceSid);
    } else {
      params.set('From', twilio.from);
    }

    const twRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!twRes.ok) {
      const t = await twRes.text();
      console.warn('[send-appointment-sms] Twilio HTTP', twRes.status, t);
      return new Response(JSON.stringify({ ok: false, error: 'twilio_failed', detail: t.slice(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.warn('[send-appointment-sms]', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
