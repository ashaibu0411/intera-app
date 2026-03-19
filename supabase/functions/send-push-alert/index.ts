// Supabase Edge Function: send-push-alert
// Sends remote push notifications via Expo Push API and writes to public.notifications.
//
// Secrets required (Supabase Dashboard -> Edge Functions -> Secrets):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Payload supports:
// - direct: { recipientUserId, title, body, data?, excludeUserId? }
// - scoped: { scope: 'global'|'city'|'neighborhood', city?, neighborhood?, title, body, data?, excludeUserId? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

type Scope = 'neighborhood' | 'city' | 'global';

type Body = {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  excludeUserId?: string | null;

  // direct
  recipientUserId?: string;

  // scoped
  scope?: Scope;
  city?: string | null;
  neighborhood?: string | null;

  // optional metadata for in-app notifications
  type?: string;
  actorId?: string | null;
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function sendExpoPush(messages: Array<{ to: string; title: string; body: string; data?: any; sound?: any; channelId?: string }>) {
  if (messages.length === 0) return { sent: 0, tickets: [] as any[] };

  // Expo allows up to 100 messages per request
  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) chunks.push(messages.slice(i, i + 100));

  const tickets: any[] = [];
  const requestErrors: Array<{ status?: number; error: string }> = [];
  for (const chunk of chunks) {
    try {
      const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      const j = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.log('[send-push-alert] Expo push error', resp.status, j);
        requestErrors.push({ status: resp.status, error: JSON.stringify(j ?? {}) });
        continue;
      }
      const data = (j as any)?.data;
      if (Array.isArray(data)) tickets.push(...data);
    } catch (e) {
      const msg = String((e as any)?.message ?? e);
      console.log('[send-push-alert] Expo push request failed', msg);
      requestErrors.push({ error: msg });
      continue;
    }
  }

  return { sent: messages.length, tickets, requestErrors };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_KEY') ??
      '';
    if (!supabaseUrl || !serviceKey) {
      return json(500, {
        error:
          'Missing SUPABASE_URL or service role key. Set one of: SUPABASE_SERVICE_ROLE_KEY, SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY',
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    // Verify the caller is authenticated (prevents abuse).
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await authClient.auth.getUser();
    if (!userData?.user?.id) return json(401, { error: 'Unauthorized' });

    const body = (await req.json().catch(() => ({}))) as Body;
    const title = String(body?.title ?? '').trim();
    const messageBody = String(body?.body ?? '').trim();
    if (!title || !messageBody) return json(400, { error: 'Missing title/body' });

    const excludeUserId = body?.excludeUserId ? String(body.excludeUserId) : null;

    const type = typeof body?.type === 'string' && body.type.trim().length ? body.type.trim() : 'alert';
    const actorId = body?.actorId ? String(body.actorId) : null;
    const dataPayload = (body?.data ?? {}) as Record<string, unknown>;

    console.log('[send-push-alert] request', {
      caller: userData.user.id,
      direct: !!body?.recipientUserId,
      scope: body?.scope ?? null,
      city: body?.city ?? null,
      neighborhood: body?.neighborhood ?? null,
      excludeUserId,
      type,
      actorId,
    });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    let recipientUserIds: string[] = [];
    if (body?.recipientUserId) {
      recipientUserIds = [String(body.recipientUserId)];
    } else if (body?.scope) {
      const scope = body.scope;
      const city = body?.city ? String(body.city).trim() : '';
      const neighborhood = body?.neighborhood ? String(body.neighborhood).trim() : '';

      let q = admin
        .from('push_tokens')
        .select('user_id')
        .eq('enabled', true);

      if (scope === 'neighborhood') {
        if (neighborhood) q = q.ilike('neighborhood', neighborhood);
        if (city) q = q.ilike('city', city);
      } else if (scope === 'city') {
        // Include both city-matched tokens AND tokens with null/empty city (e.g. TestFlight users
        // who haven't synced location yet) so iOS→Android and cross-platform notifications work.
        if (city) {
          q = q.or(`city.ilike.${city},city.is.null`);
        }
      }

      const { data } = await q.limit(5000);
      recipientUserIds = (data ?? []).map((r: any) => String(r.user_id));

      // Fallback: if city/neighborhood scope returned no recipients, try global (avoids missing
      // users whose push_tokens have null city, e.g. on TestFlight or before location sync).
      if (recipientUserIds.length === 0 && (scope === 'city' || scope === 'neighborhood')) {
        const { data: fallbackData } = await admin
          .from('push_tokens')
          .select('user_id')
          .eq('enabled', true)
          .limit(5000);
        recipientUserIds = (fallbackData ?? []).map((r: any) => String(r.user_id));
      }
    } else {
      return json(400, { error: 'Missing recipientUserId or scope' });
    }

    recipientUserIds = uniq(recipientUserIds).filter(Boolean);
    if (excludeUserId) recipientUserIds = recipientUserIds.filter((id) => id !== excludeUserId);
    if (recipientUserIds.length === 0) {
      console.log('[send-push-alert] no recipients after filters');
      return json(200, { ok: true, recipients: 0, tokens: 0, sent: 0 });
    }

    // Insert in-app notifications (best-effort)
    try {
      const rows = recipientUserIds.map((rid) => ({
        recipient_id: rid,
        actor_id: actorId,
        type,
        title,
        body: messageBody,
        data: { ...dataPayload, type },
      }));
      await admin.from('notifications').insert(rows);
    } catch (e) {
      console.log('[send-push-alert] notifications insert failed (non-fatal):', String((e as any)?.message ?? e));
    }

    // Get Expo push tokens for recipients
    const { data: tokenRows } = await admin
      .from('push_tokens')
      .select('token,user_id,platform')
      .in('user_id', recipientUserIds)
      .eq('enabled', true)
      .limit(10000);

    const tokenObjs = uniq((tokenRows ?? []).map((r: any) => JSON.stringify({
      token: String(r?.token ?? ''),
      platform: String(r?.platform ?? 'unknown'),
    })))
      .map((s) => {
        try { return JSON.parse(s) as { token: string; platform: string }; } catch { return { token: '', platform: 'unknown' }; }
      })
      .filter((x) => !!x.token);

    console.log('[send-push-alert] resolved', { recipients: recipientUserIds.length, tokens: tokenObjs.length });

    const expoMessages = tokenObjs.map((t) => ({
      to: t.token,
      title,
      body: messageBody,
      data: dataPayload,
      sound: 'default',
      // Android: if channelId is not set, notifications may land on a low-importance default channel.
      ...(t.platform === 'android' ? { channelId: 'alerts' } : null),
    }));

    const expo = await sendExpoPush(expoMessages);
    const failedTickets = (expo.tickets || []).filter((t: any) => t?.status === 'error');
    if (failedTickets.length) {
      console.log('[send-push-alert] expo ticket errors', failedTickets.slice(0, 10));
    }
    return json(200, {
      ok: true,
      recipients: recipientUserIds.length,
      tokens: tokenObjs.length,
      sent: expo.sent,
      ticketErrors: failedTickets.slice(0, 5),
      requestErrors: (expo as any)?.requestErrors?.slice?.(0, 3) ?? [],
    });
  } catch (err) {
    console.log('[send-push-alert] Unexpected error:', String(err));
    return json(500, { error: 'Unexpected error', details: String(err) });
  }
});
