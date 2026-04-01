-- Push tokens for Expo + per-channel preferences (used by send-push-alert Edge Function)
-- Safe to run once; idempotent pieces only.

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text,
  device_id text,
  enabled boolean NOT NULL DEFAULT true,
  city text,
  neighborhood text,
  country text,
  admin_area text,
  notify_connect_posts boolean NOT NULL DEFAULT true,
  notify_general_posts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_token_unique UNIQUE (token)
);

-- If an older push_tokens table existed without preference columns:
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS notify_connect_posts boolean NOT NULL DEFAULT true;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS notify_general_posts boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_enabled_city ON public.push_tokens (enabled, city)
  WHERE enabled = true;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users manage own push tokens"
  ON public.push_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (Edge Functions) uses service key and bypasses RLS.

COMMENT ON TABLE public.push_tokens IS 'Expo push tokens + location hints + notification channel prefs for send-push-alert.';
COMMENT ON COLUMN public.push_tokens.notify_connect_posts IS 'If false, skip remote pushes for type connect_post.';
COMMENT ON COLUMN public.push_tokens.notify_general_posts IS 'If false, skip remote pushes for general new_post in area.';
