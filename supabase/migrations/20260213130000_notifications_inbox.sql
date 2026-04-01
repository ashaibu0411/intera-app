-- In-app notifications inbox (used by notifications.tsx + useUnreadNotifications)
-- Inserts from the app set actor_id = author; recipients can read/update/delete their rows.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Post author can insert rows for other users (community + connect_post fan-out)
DROP POLICY IF EXISTS "notifications_insert_as_actor" ON public.notifications;
CREATE POLICY "notifications_insert_as_actor"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

COMMENT ON TABLE public.notifications IS 'In-app inbox; connect_post and new_post rows created when posts notify an area.';

-- Enable Realtime for this table: Dashboard → Database → Publications → supabase_realtime → add `notifications`
-- Or run once: ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
