-- Optional: show Intera profile name in lobby for people who want to be open.
-- Run after 20260211120000_open_connect_privacy_display.sql

ALTER TABLE public.open_connect_sessions
  ADD COLUMN IF NOT EXISTS use_profile_name boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.open_connect_sessions.use_profile_name IS 'If true, lobby shows profiles.name instead of connect nickname.';

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
  ORDER BY s.until DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.open_connect_lobby(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_connect_lobby(text, text) TO authenticated;
