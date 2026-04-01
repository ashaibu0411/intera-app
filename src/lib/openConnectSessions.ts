import { supabase } from './supabase';

export type OpenConnectLobbyRow = {
  user_id: string;
  screen_name: string;
  session_intro: string | null;
  avatar_url: string | null;
  until: string;
  context_id: string;
  vibe_id: string;
  neighborhood: string | null;
};

function normalizeLobbyRow(r: Record<string, unknown>): OpenConnectLobbyRow {
  const legacyName = typeof r.name === 'string' ? r.name : '';
  return {
    user_id: String(r.user_id ?? ''),
    screen_name:
      typeof r.screen_name === 'string' && r.screen_name.trim()
        ? r.screen_name
        : legacyName || 'Friend',
    session_intro: typeof r.session_intro === 'string' ? r.session_intro : null,
    avatar_url: typeof r.avatar_url === 'string' ? r.avatar_url : null,
    until: String(r.until ?? ''),
    context_id: String(r.context_id ?? 'general'),
    vibe_id: String(r.vibe_id ?? 'chat'),
    neighborhood: typeof r.neighborhood === 'string' ? r.neighborhood : null,
  };
}

/** Upsert the signed-in user's open session (nickname by default; optional profile name). */
export async function upsertOpenConnectSession(input: {
  untilMs: number;
  contextId: string;
  vibeId: string;
  durationMins: number;
  city: string;
  country: string;
  neighborhood?: string | null;
  displayAlias?: string | null;
  sessionIntro?: string | null;
  revealAvatar?: boolean;
  /** If true, lobby shows profiles.name (for people who want to be open). */
  useProfileName?: boolean;
}): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('Sign in to share your open status.');

  const untilIso = new Date(input.untilMs).toISOString();
  const payload: Record<string, unknown> = {
    user_id: user.id,
    until: untilIso,
    context_id: input.contextId,
    vibe_id: input.vibeId,
    duration_mins: input.durationMins,
    city: input.city.trim(),
    country: input.country.trim(),
    neighborhood: input.neighborhood?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const alias = input.displayAlias?.trim();
  if (alias) payload.display_alias = alias;
  else payload.display_alias = null;

  const intro = input.sessionIntro?.trim();
  if (intro) payload.session_intro = intro;
  else payload.session_intro = null;

  payload.reveal_avatar = !!input.revealAvatar;
  payload.use_profile_name = !!input.useProfileName;

  let attempt: Record<string, unknown> = { ...payload };
  let { error } = await supabase.from('open_connect_sessions').upsert(attempt, { onConflict: 'user_id' });

  const errLower = () => (error?.message || '').toLowerCase();
  if (error && errLower().includes('use_profile_name')) {
    const { use_profile_name: _, ...rest } = attempt;
    attempt = rest;
    ({ error } = await supabase.from('open_connect_sessions').upsert(attempt, { onConflict: 'user_id' }));
  }
  if (
    error &&
    (errLower().includes('display_alias') ||
      errLower().includes('session_intro') ||
      errLower().includes('reveal_avatar'))
  ) {
    const { display_alias: _a, session_intro: _i, reveal_avatar: _r, ...legacy } = attempt;
    ({ error } = await supabase.from('open_connect_sessions').upsert(legacy, { onConflict: 'user_id' }));
  }

  if (error) {
    console.warn('[openConnect] upsert failed:', error.message);
    throw error;
  }
}

export async function deleteOpenConnectSession(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('open_connect_sessions').delete().eq('user_id', user.id);
  if (error) console.warn('[openConnect] delete failed:', error.message);
}

export type MyOpenConnectSession = {
  until: string;
  context_id: string;
  vibe_id: string;
  duration_mins: number;
  display_alias: string | null;
  session_intro: string | null;
  reveal_avatar: boolean;
  use_profile_name: boolean;
};

/** Active session for current user (if any). */
export async function fetchMyOpenConnectSession(): Promise<MyOpenConnectSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('open_connect_sessions')
    .select(
      'until, context_id, vibe_id, duration_mins, display_alias, session_intro, reveal_avatar, use_profile_name'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[openConnect] fetch mine failed:', error.message);
    const { data: mid, error: eMid } = await supabase
      .from('open_connect_sessions')
      .select('until, context_id, vibe_id, duration_mins, display_alias, session_intro, reveal_avatar')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!eMid && mid) {
      const until = new Date((mid as any).until).getTime();
      if (until <= Date.now()) return null;
      return {
        until: (mid as any).until,
        context_id: (mid as any).context_id,
        vibe_id: (mid as any).vibe_id,
        duration_mins: (mid as any).duration_mins,
        display_alias: (mid as any).display_alias ?? null,
        session_intro: (mid as any).session_intro ?? null,
        reveal_avatar: !!(mid as any).reveal_avatar,
        use_profile_name: false,
      };
    }
    const { data: legacy, error: e2 } = await supabase
      .from('open_connect_sessions')
      .select('until, context_id, vibe_id, duration_mins')
      .eq('user_id', user.id)
      .maybeSingle();
    if (e2 || !legacy) return null;
    const until = new Date((legacy as any).until).getTime();
    if (until <= Date.now()) return null;
    return {
      until: (legacy as any).until,
      context_id: (legacy as any).context_id,
      vibe_id: (legacy as any).vibe_id,
      duration_mins: (legacy as any).duration_mins,
      display_alias: null,
      session_intro: null,
      reveal_avatar: false,
      use_profile_name: false,
    };
  }
  if (!data) return null;
  const until = new Date((data as any).until).getTime();
  if (until <= Date.now()) return null;
  return {
    until: (data as any).until,
    context_id: (data as any).context_id,
    vibe_id: (data as any).vibe_id,
    duration_mins: (data as any).duration_mins,
    display_alias: (data as any).display_alias ?? null,
    session_intro: (data as any).session_intro ?? null,
    reveal_avatar: !!(data as any).reveal_avatar,
    use_profile_name: !!(data as any).use_profile_name,
  };
}

/** Other people open in the same city + country (excludes self). */
export async function fetchOpenConnectLobby(city: string, country: string): Promise<OpenConnectLobbyRow[]> {
  const c = city?.trim();
  const co = country?.trim();
  if (!c || !co) return [];

  const { data, error } = await supabase.rpc('open_connect_lobby', {
    p_city: c,
    p_country: co,
  });

  if (error) {
    console.warn('[openConnect] lobby RPC:', error.message);
    return [];
  }
  return (data || []).map((row: Record<string, unknown>) => normalizeLobbyRow(row));
}
