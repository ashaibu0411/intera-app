-- Open to connect: explicit community membership (city-scoped UX stays in app; this gates who can see/participate).
-- Default false: general app users are not in the Open to connect community until they join.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS open_connect_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.open_connect_opt_in IS 'User joined Open to connect: lobby, connect wall, and connect_post notifications/pushes target opted-in members in area.';

CREATE INDEX IF NOT EXISTS idx_profiles_open_connect_opt_in
  ON public.profiles (open_connect_opt_in)
  WHERE open_connect_opt_in = true;

-- Lobby: viewer must be opted in; only show peers who are also opted in (same city/country as today).
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
      SELECT 1
      FROM public.profiles viewer
      WHERE viewer.id = auth.uid()
        AND coalesce(viewer.open_connect_opt_in, false) = true
    )
  ORDER BY s.until DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.open_connect_lobby(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_connect_lobby(text, text) TO authenticated;

-- Only opted-in members can create/update their session row (can still delete when leaving).
DROP POLICY IF EXISTS "open_connect_sessions_own_all" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_select_own" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_insert_opted_in" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_update_opted_in" ON public.open_connect_sessions;
DROP POLICY IF EXISTS "open_connect_sessions_delete_own" ON public.open_connect_sessions;

CREATE POLICY "open_connect_sessions_select_own"
  ON public.open_connect_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "open_connect_sessions_insert_opted_in"
  ON public.open_connect_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND coalesce(pr.open_connect_opt_in, false) = true
    )
  );

CREATE POLICY "open_connect_sessions_update_opted_in"
  ON public.open_connect_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND coalesce(pr.open_connect_opt_in, false) = true
    )
  );

CREATE POLICY "open_connect_sessions_delete_own"
  ON public.open_connect_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
