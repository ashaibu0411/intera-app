-- Open to connect — base table, RLS, lobby RPC (v1), posts.connect_post
-- Later migrations replace open_connect_lobby with privacy + profile-name logic.

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

CREATE INDEX IF NOT EXISTS idx_open_connect_sessions_until
  ON public.open_connect_sessions (until DESC);

ALTER TABLE public.open_connect_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_connect_sessions_own_all" ON public.open_connect_sessions;
CREATE POLICY "open_connect_sessions_own_all"
  ON public.open_connect_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- v1 RPC (replaced by 20260211120000 and 20260212120000)
DROP FUNCTION IF EXISTS public.open_connect_lobby(text, text);

CREATE OR REPLACE FUNCTION public.open_connect_lobby(p_city text, p_country text)
RETURNS TABLE (
  user_id uuid,
  name text,
  username text,
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
    p.name,
    p.username,
    p.avatar_url,
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

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS connect_post boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_connect_post_created
  ON public.posts (connect_post, created_at DESC)
  WHERE connect_post = true;
