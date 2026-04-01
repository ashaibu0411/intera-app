/**
 * Supabase Edge Function: targeted Expo push using public.push_tokens.
 *
 * Deploy: supabase functions deploy send-push-alert --no-verify-jwt
 *   (Or verify JWT — see docs/PUSH_ALERTS.md)
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 * Optional: EXPO_ACCESS_TOKEN (Expo dashboard → Access tokens)
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function norm(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase();
}

function cityMatch(rowCity: string | null, target: string | null): boolean {
  const a = norm(rowCity);
  const b = norm(target);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function neighborhoodMatch(rowN: string | null, target: string | null): boolean {
  const a = norm(rowN);
  const b = norm(target);
  if (!b) return true;
  if (!a) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function stringifyData(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

async function sendExpoBatch(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>
) {
  if (tokens.length === 0) return;

  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    sound: 'default',
    priority: 'high',
    data: stringifyData(data),
  }));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  const access = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const t = await res.text();
    console.warn('[send-push-alert] Expo HTTP', res.status, t);
  }
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

    const admin = createClient(supabaseUrl, serviceKey);
    const body = (await req.json()) as Record<string, unknown>;

    const title = String(body.title ?? '');
    const msgBody = body.body != null ? String(body.body) : '';
    if (!title || !msgBody) {
      return new Response(JSON.stringify({ error: 'title and body required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientUserId = body.recipientUserId as string | undefined;
    const excludeUserId = body.excludeUserId as string | null | undefined;
    const scope = String(body.scope ?? 'city').toLowerCase();
    const city = (body.city as string | null) ?? null;
    const neighborhood = (body.neighborhood as string | null) ?? null;
    const type = body.type as string | undefined;
    const actorId = (body.actorId as string | null) ?? null;
    const data = (body.data as Record<string, unknown>) ?? {};

    // Direct push (DM, connection request to one user, etc.)
    if (recipientUserId) {
      const { data: rows, error } = await admin
        .from('push_tokens')
        .select('token')
        .eq('user_id', recipientUserId)
        .eq('enabled', true);

      if (error) throw error;
      const tokens = (rows ?? []).map((r: { token: string }) => r.token).filter(Boolean);
      await sendExpoBatch(tokens, title, msgBody, {
        ...data,
        type: type ?? (data.type as string) ?? 'direct',
        actorId: actorId ?? undefined,
      });
      return new Response(JSON.stringify({ ok: true, sent: tokens.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notificationType = String(type ?? data?.type ?? 'alert');
    const isConnect = notificationType === 'connect_post' || data?.connectPost === true;
    const isGeneralAreaPost = notificationType === 'new_post' || notificationType === 'post';

    const { data: rows, error: qerr } = await admin
      .from('push_tokens')
      .select(
        'token, user_id, city, neighborhood, notify_connect_posts, notify_general_posts'
      )
      .eq('enabled', true);

    if (qerr) {
      // Table missing — don’t 500 the app
      console.warn('[send-push-alert] push_tokens query:', qerr.message);
      return new Response(JSON.stringify({ ok: false, skipped: true, reason: 'no_push_tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const filtered = (rows ?? []).filter((row: Record<string, unknown>) => {
      if (excludeUserId && row.user_id === excludeUserId) return false;

      if (isConnect && row.notify_connect_posts === false) return false;
      if (isGeneralAreaPost && row.notify_general_posts === false) return false;

      if (scope === 'global') return true;
      if (!city) return false;
      if (!cityMatch(row.city as string | null, city)) return false;
      if (scope === 'neighborhood') {
        return neighborhoodMatch(row.neighborhood as string | null, neighborhood);
      }
      return true;
    });

    const tokens = filtered.map((r: { token: string }) => r.token).filter(Boolean);
    const chunk = 99;
    let sent = 0;
    for (let i = 0; i < tokens.length; i += chunk) {
      const slice = tokens.slice(i, i + chunk);
      await sendExpoBatch(slice, title, msgBody, {
        ...data,
        type: notificationType,
        postId: data.postId,
        authorId: (data.authorId as string) || actorId || undefined,
      });
      sent += slice.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        candidates: (rows ?? []).length,
        matched: tokens.length,
        sent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
