-- =============================================================================
-- WHAT DO I HAVE? — Run in Supabase → SQL Editor (all at once is OK)
-- Read each result grid separately. Empty = no matches for that pattern.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Columns that usually mean Stripe / Connect / payments
-- ---------------------------------------------------------------------------
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%stripe%'
    OR column_name ILIKE '%connect%'
    OR column_name ILIKE '%payment%'
    OR column_name ILIKE '%intent%'
    OR column_name ILIKE '%checkout%'
    OR column_name ILIKE '%subscription%'
  )
ORDER BY table_name, ordinal_position;

-- ---------------------------------------------------------------------------
-- 2) Tables that often go with bookings / businesses / orders
-- ---------------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (
    table_name ILIKE '%book%'
    OR table_name ILIKE '%appoint%'
    OR table_name ILIKE '%business%'
    OR table_name ILIKE '%order%'
    OR table_name ILIKE '%pay%'
    OR table_name ILIKE '%slot%'
    OR table_name ILIKE '%calendar%'
  )
ORDER BY table_name;

-- ---------------------------------------------------------------------------
-- 3) All columns on `businesses` (see full picture for that table)
-- ---------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
ORDER BY ordinal_position;

-- ---------------------------------------------------------------------------
-- 4) All columns on `appointments` (if table exists — empty if it doesn’t)
-- ---------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
ORDER BY ordinal_position;

-- ---------------------------------------------------------------------------
-- 5) All columns on `business_booking_settings` (if exists)
-- ---------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'business_booking_settings'
ORDER BY ordinal_position;

-- ---------------------------------------------------------------------------
-- 6) Public functions / RPCs whose names suggest money or bookings
-- ---------------------------------------------------------------------------
SELECT
  routine_name AS function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name ILIKE '%stripe%'
    OR routine_name ILIKE '%payment%'
    OR routine_name ILIKE '%book%'
    OR routine_name ILIKE '%appoint%'
    OR routine_name ILIKE '%connect%'
  )
ORDER BY routine_name;

-- ---------------------------------------------------------------------------
-- 7) Open to connect (separate from Stripe) — table exists?
-- ---------------------------------------------------------------------------
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'open_connect_sessions'
  ) AS has_open_connect_sessions,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'connect_post'
  ) AS posts_has_connect_post,
  EXISTS (
    SELECT 1
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'open_connect_lobby'
  ) AS has_open_connect_lobby_rpc;
