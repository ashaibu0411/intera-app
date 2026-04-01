# Push alerts (`send-push-alert` + `push_tokens`)

## 1. Database

Run the migration:

- `supabase/migrations/20260213120000_push_tokens_and_preferences.sql`

Or paste it in the SQL editor. This creates **`push_tokens`** with:

| Column | Purpose |
|--------|---------|
| `user_id`, `token`, `platform`, `device_id` | Expo device token (unique per token) |
| `enabled` | Master on/off for this device (synced from Settings → Push notifications) |
| `city`, `neighborhood`, `country`, `admin_area` | From the user’s selected location (for targeting) |
| `notify_general_posts` | Community / area post pushes (`new_post`, `post`) |
| `notify_connect_posts` | Open to connect / Nearby post pushes (`connect_post`) |

RLS: users can only read/write **their own** rows. The Edge Function uses the **service role** to read all tokens.

## 2. Edge Function

Path: **`supabase/functions/send-push-alert/index.ts`**

Deploy (from `intera-app`):

```bash
supabase functions deploy send-push-alert
```

Set secrets (Dashboard → Edge Functions → Secrets, or CLI):

- `SUPABASE_URL` — usually auto
- `SUPABASE_SERVICE_ROLE_KEY` — service role
- `SUPABASE_ANON_KEY` — anon key (used to validate the caller’s JWT)
- `EXPO_ACCESS_TOKEN` — optional; recommended for production ([Expo access tokens](https://docs.expo.dev/accounts/programming-access-tokens/))

The function:

1. Verifies **`Authorization: Bearer <user JWT>`** (same session as `supabase.auth`).
2. For **`recipientUserId`**: sends to that user’s enabled tokens (direct alerts).
3. Otherwise loads enabled tokens and filters by:
   - **`scope`**: `global` | `city` | `neighborhood`
   - **`city` / `neighborhood`** (case-insensitive, substring match for flexibility)
   - **`connect_post`**: skips rows with `notify_connect_posts = false`
   - **`new_post` / `post`**: skips rows with `notify_general_posts = false`
   - Other `type` values are not filtered by those two flags (e.g. DMs already use `recipientUserId`).

## 3. App

- **Settings → Notifications**: master switch + **Community posts in your area** + **Open to connect nearby**.
- **`syncPushTokenFromStore`** (in `_layout`) upserts `push_tokens` when location or prefs change.

## 4. In-app notifications inbox

Migration: **`supabase/migrations/20260213130000_notifications_inbox.sql`**

Creates **`public.notifications`** with RLS:

- Recipients **select/update/delete** their own rows.
- Authenticated users may **insert** rows where **`actor_id = auth.uid()`** (so a post author can fan out rows to many `recipient_id`s).

After applying, enable **Realtime** for `notifications` (Dashboard → Database → Publications → `supabase_realtime` → add table `notifications`), or:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

The **Notifications** screen loads this table, shows **Open to connect** filter, and opens **`connect_post`** items on the post like **`new_post`**.

---

## 5. Troubleshooting

| Issue | Check |
|--------|--------|
| No pushes | User logged in, OS notifications on, `push_tokens` row exists, function deployed |
| Everyone gets global pushes | `scope` / `city` not set on `sendRemotePushAlert` payload |
| Connect pushes ignored | `notify_connect_posts` / migration / column exists |
| 401 from function | Client must call `supabase.functions.invoke` **with an authenticated session** |
