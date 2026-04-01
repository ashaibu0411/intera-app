-- Open to connect: privacy-first lobby — nickname / intro, optional photo, no real names in RPC.
-- Run after 20260210120000_open_connect_lobby.sql

ALTER TABLE public.open_connect_sessions
  ADD COLUMN IF NOT EXISTS display_alias text,
  ADD COLUMN IF NOT EXISTS session_intro text,
  ADD COLUMN IF NOT EXISTS reveal_avatar boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.open_connect_sessions.display_alias IS 'Lobby-only nickname; not legal name.';
COMMENT ON COLUMN public.open_connect_sessions.session_intro IS 'Short optional blurb for this session only.';
COMMENT ON COLUMN public.open_connect_sessions.reveal_avatar IS 'If false, lobby hides profile photo.';

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
    COALESCE(
      NULLIF(btrim(s.display_alias), ''),
      'Friend·' || upper(substr(md5(s.user_id::text), 1, 4))
    ) AS screen_name,
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
  ORDER BY s.until DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.open_connect_lobby(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_connect_lobby(text, text) TO authenticated;
