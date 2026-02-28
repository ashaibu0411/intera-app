// Supabase Edge Function: send-push-alert
// Sends remote push notifications via Expo Push API, scoped by city/neighborhood/global.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Scope = 'neighborhood' | 'city' | 'global';

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const title: string = body.title;
    const message: string = body.body;
    const scope: Scope = body.scope || 'city';
    const city: string | null = body.city ?? null;
    const neighborhood: string | null = body.neighborhood ?? null;
    const excludeUserId: string | null = body.excludeUserId ?? null;
    const recipientUserId: string | null = body.recipientUserId ?? null;
    const data: Record<string, unknown> = body.data ?? {};
    const type: string = String((body.type ?? (data as any)?.type ?? 'alert') || 'alert');
    const actorId: string | null = body.actorId ?? (data as any)?.actorId ?? null;

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Missing title/body' }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let q = supabase
      .from('push_tokens')
      .select('token, user_id, city, neighborhood')
      .eq('enabled', true);

    if (excludeUserId) q = q.neq('user_id', excludeUserId);

    // Direct-to-user push (bypasses scope filters)
    if (recipientUserId) {
      q = q.eq('user_id', recipientUserId);
    } else
    if (scope === 'global') {
      // no filter
    } else if (scope === 'city') {
      if (!city) return new Response(JSON.stringify({ error: 'Missing city for scope=city' }), { status: 400 });
      q = q.eq('city', city);
    } else if (scope === 'neighborhood') {
      if (!city || !neighborhood) {
        return new Response(JSON.stringify({ error: 'Missing city/neighborhood for scope=neighborhood' }), { status: 400 });
      }
      q = q.eq('city', city).eq('neighborhood', neighborhood);
    }

    const { data: rows, error } = await q;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const userIds = uniq((rows || []).map((r: any) => r.user_id).filter(Boolean));

    // Write in-app notifications (best-effort; service role bypasses RLS)
    try {
      if (userIds.length > 0) {
        const inserts = userIds.map((uid: string) => ({
          recipient_id: uid,
          actor_id: actorId,
          type,
          title,
          body: message.length > 500 ? message.slice(0, 500) + '…' : message,
          data,
        }));
        await supabase.from('notifications').insert(inserts);
      }
    } catch {
      // ignore (table may not be deployed yet)
    }

    const tokens = (rows || []).map((r: any) => r.token).filter(Boolean);
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
    }

    // Expo supports batching
    const messages = tokens.map((to: string) => ({
      to,
      sound: 'default',
      title,
      body: message.length > 180 ? message.slice(0, 180) + '…' : message,
      data,
      channelId: 'alerts',
      priority: 'high',
    }));

    const chunks: any[][] = [];
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) chunks.push(messages.slice(i, i + chunkSize));

    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN'); // optional but recommended
    let sent = 0;
    for (const chunk of chunks) {
      const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
        },
        body: JSON.stringify(chunk),
      });
      if (resp.ok) sent += chunk.length;
    }

    return new Response(JSON.stringify({ ok: true, sent, recipients: userIds.length }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

