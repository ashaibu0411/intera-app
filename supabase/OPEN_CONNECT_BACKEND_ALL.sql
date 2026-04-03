-- =============================================================================
-- INTERA — Open to connect + connect feed flag (Supabase / Postgres)
--
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run on the same project (IF NOT EXISTS / DROP + CREATE function).
--
-- Requires: public.profiles(id) linked to auth (standard Supabase pattern).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Sessions table (one active row per user; upsert on user_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.open_connect_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  until timestamptz NOT NULL,
  context_id text NOT NULL DEFAULT 'general',
  vibe_id text NOT NULL DEFAULT 'chat',
  duration_mins int NOT NULL DEFAULT 60,
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  neighborhood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT open_connect_sessions_user_id_unique UNIQUE (user_id)
);

-- Extra columns (no-op if already applied via older migrations)
ALTER TABLE public.open_connect_sessions
  ADD COLUMN IF NOT EXISTS display_alias text;
ALTER TABLE public.open_connect_sessions
  ADD COLUMN IF NOT EXISTS session_intro text;
ALTER TABLE public.open_connect_sessions
  ADD COLUMN IF NOT EXISTS reveal_avatar boolean NOT NULL DEFAULT false;
ALTER TABLE public.open_connect_sessions
  ADD COLUMN IF NOT EXISTS use_profile_name boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.open_connect_sessions.display_alias IS 'Lobby-only nickname; not legal name.';
COMMENT ON COLUMN public.open_connect_sessions.session_intro IS 'Short optional blurb for this session only.';
COMMENT ON COLUMN public.open_connect_sessions.reveal_avatar IS 'If false, lobby hides profile photo.';
COMMENT ON COLUMN public.open_connect_sessions.use_profile_name IS 'If true, lobby shows profiles.name instead of connect nickname.';

CREATE INDEX IF NOT EXISTS idx_open_connect_sessions_until
  ON public.open_connect_sessions (until DESC);

ALTER TABLE public.open_connect_sessions ENABLE ROW LEVEL SECURITY;

-- profiles.open_connect_opt_in required to insert/update session (see migration 20260215120000).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS open_connect_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.open_connect_opt_in IS 'User joined Open to connect: lobby, connect wall, and connect_post notifications/pushes target opted-in members in area.';

CREATE INDEX IF NOT EXISTS idx_profiles_open_connect_opt_in
  ON public.profiles (open_connect_opt_in)
  WHERE open_connect_opt_in = true;

DROP POLICY IF EXISTS "open_connect_sessions_own_all" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_select_own" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_insert_opted_in" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_update_opted_in" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_delete_own" ON public.open_connect_sessions;

CREATE POLICY "open_connect_sessions_select_own"
  ON public.open_connect_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "open_connect_sessions_insert_opted_in"
  ON public.open_connect_sessions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND coalesce(pr.open_connect_opt_in, false) = true
    )
  );

CREATE POLICY "open_connect_sessions_update_opted_in"
  ON public.open_connect_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND coalesce(pr.open_connect_opt_in, false) = true
    )
  );

CREATE POLICY "open_connect_sessions_delete_own"
  ON public.open_connect_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) Lobby RPC — returns lobby-only fields (no legal name unless user opted in)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.open_connect_lobby(text, text);

CREATE OR REPLACE FUNCTION public.open_connect_lobby(p_city text, p_country text)
RETURNS TABLE (
  user_id uuid,
  screen_name text,
  session_intro text,
  avatar_url text,
  until timestamptz,
  context_id text,
  vibe_id text,
  neighborhood text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.user_id,
    CASE
      WHEN coalesce(s.use_profile_name, false) THEN
        COALESCE(
          NULLIF(btrim(p.name), ''),
          NULLIF(btrim(s.display_alias), ''),
          'Friend·' || upper(substr(md5(s.user_id::text), 1, 4))
        )
      ELSE
        COALESCE(
          NULLIF(btrim(s.display_alias), ''),
          'Friend·' || upper(substr(md5(s.user_id::text), 1, 4))
        )
    END AS screen_name,
    NULLIF(btrim(s.session_intro), '') AS session_intro,
    CASE
      WHEN coalesce(s.reveal_avatar, false) THEN p.avatar_url
      ELSE NULL
    END AS avatar_url,
    s.until,
    s.context_id,
    s.vibe_id,
    s.neighborhood
  FROM public.open_connect_sessions s
  INNER JOIN public.profiles p ON p.id = s.user_id
  WHERE s.until > now()
    AND btrim(lower(s.city)) = btrim(lower(coalesce(p_city, '')))
    AND btrim(lower(s.country)) = btrim(lower(coalesce(p_country, '')))
    AND s.user_id <> auth.uid()
    AND coalesce(p.open_connect_opt_in, false) = true
    AND EXISTS (
      SELECT 1 FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND coalesce(viewer.open_connect_opt_in, false) = true
    )
  ORDER BY s.until DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.open_connect_lobby(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_connect_lobby(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Posts: “Open to connect” filter in community updates
-- ---------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS connect_post boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_connect_post_created
  ON public.posts (connect_post, created_at DESC)
  WHERE connect_post = true;

-- =============================================================================
-- Done. Client calls: supabase.rpc('open_connect_lobby', { p_city, p_country })
-- =============================================================================
