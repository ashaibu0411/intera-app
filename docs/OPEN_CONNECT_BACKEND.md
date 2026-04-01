# Open to connect — Supabase backend

Everything the app expects for **Open to connect** (lobby + connect feed flag) is in SQL below. Use **one** of the two options so you don’t lose track.

---

## Option A — Single file (recommended)

1. Open **Supabase Dashboard** → **SQL Editor** → New query.
2. Paste the full contents of:

   **`supabase/OPEN_CONNECT_BACKEND_ALL.sql`**

3. Run it once.  
   It is safe to run again on the same project (uses `IF NOT EXISTS` and replaces the function).

This file includes:

| Piece | Purpose |
|--------|--------|
| `open_connect_sessions` | One row per user while “open”; city/country for matching; nickname, intro, photo flag, “use profile name” flag |
| RLS | Users can only read/write **their own** row (lobby uses `SECURITY DEFINER` RPC) |
| `open_connect_lobby(p_city, p_country)` | Returns other people in the same city+country with `screen_name`, optional intro, optional avatar |
| `posts.connect_post` | Boolean for “Open to connect” tab in community updates |

---

## Option B — Migrations in order (CLI / `supabase db push`)

If you apply migrations from the repo instead of the single file, run **in this order**:

1. `supabase/migrations/20260210120000_open_connect_lobby.sql` — table, RLS, **v1** RPC (returns `name` / old shape), `connect_post`  
2. `supabase/migrations/20260211120000_open_connect_privacy_display.sql` — adds privacy columns, **replaces** RPC with `screen_name` shape  
3. `supabase/migrations/20260212120000_open_connect_use_profile_name.sql` — adds `use_profile_name`, **final** RPC  

After step 2+, the app’s `open_connect_lobby` result matches **`OPEN_CONNECT_BACKEND_ALL.sql`** (final RPC).

> If you already ran **Option A**, you do **not** need to run B (avoid duplicating conflicting steps unless you know the DB state).

---

## Client ↔ database

- **Table:** `open_connect_sessions` — upserted from the app when the user turns “open” on.  
- **RPC:** `open_connect_lobby` with `{ p_city: string, p_country: string }`.  
- **Posts:** `createPost` may set `connect_post: true` for Nearby / open-connect posts.

---

## Push notifications (Open to connect posts)

When a post is created from **Open to connect** / **Nearby** intent, the app calls `notifyCommunityAboutNewPost` with **`connectPost: true`** and:

| Feed scope (user setting) | Remote push `scope` | `city` / `neighborhood` payload |
|---------------------------|---------------------|----------------------------------|
| **City** (default) | `city` | `city` from selected location |
| **Neighborhood** (and a neighborhood is set) | `neighborhood` | both `city` and `neighborhood` |
| **Global** | `global` | — |

- Push **`type`** / **`data.type`**: `connect_post` (opens the post like `new_post` in the client).  
- **In-app** notification rows use `type: connect_post` when the DB allows it (if your `notifications.type` is an enum, add `connect_post` or map it server-side).

Your Supabase Edge Function **`send-push-alert`** must interpret:

- `scope: 'city'` — notify users who opted in and match **city** (existing behavior).  
- `scope: 'neighborhood'` — notify only users tied to that **city + neighborhood** (e.g. stored preferences on `profiles` or push tokens).  
- `scope: 'global'` — broadcast to opted-in users (use sparingly for connect posts).

If `neighborhood` targeting is not implemented yet, the function can fall back to **city** scope so users still get alerts.

**Implementation in this repo:** see **`docs/PUSH_ALERTS.md`** and the Edge Function **`supabase/functions/send-push-alert`**, plus migration **`20260213120000_push_tokens_and_preferences.sql`**.

---

## Troubleshooting

- **`function open_connect_lobby does not exist`** — Run `OPEN_CONNECT_BACKEND_ALL.sql` (or migration chain).  
- **`column connect_post does not exist`** — Same; the script adds it.  
- **`relation profiles does not exist`** — Your project must have the usual Supabase `profiles` table linked to `auth.users`.  

---

## Other backend (not in this file)

Stripe Connect, bookings, etc. live in separate migrations (e.g. `20260208120000_businesses_stripe_connect.sql`). This doc is **only** for Open to connect + `connect_post`.
