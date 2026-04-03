# Open to connect — opt-in community

## Product behavior

- **General Intera** works without joining Open to connect.
- **Lobby**, **connect post wall**, **in-app connect notifications**, and **connect_post push** are limited to users who set `profiles.open_connect_opt_in = true` (“joined”).
- **City + country** come from the user’s **selected location** in the app (not hard-tied to GPS). If someone switches city/country, they see that area’s Open to connect — fine for travel — but **copy and intent** are **local-first**: meet people where you’ve set yourself to be (ideally where you actually are).
- Neighborhood narrowing for posts uses existing audience + `filterUserIdsByLocationSubstring` after the opt-in filter.

## Deploy

1. Run migration `supabase/migrations/20260215120000_open_connect_opt_in.sql` in the Supabase SQL editor (or push migrations).
2. Redeploy Edge Function **`send-push-alert`** so connect pushes respect `open_connect_opt_in`.

## Client

- **Join**: `OpenConnectMembershipPrompt` after the 18+ gate (lobby + connect wall).
- **Leave**: Settings → **Open to connect** → turn off **Member of Open to connect**.
- **Posting** a connect-style post prompts **Join & post** if not a member yet.

## Server

- `open_connect_lobby`: returns rows only if **viewer** and **peer** are opted in.
- `open_connect_sessions` RLS: insert/update require opted-in; delete own row always allowed.
- `notifyCommunityAboutNewPost`: connect path skips if **author** not opted in; recipient list filtered with `filterUserIdsByOpenConnectOptIn`.

## Note on post visibility

Connect posts remain readable via normal `posts` SELECT if your project has permissive RLS on `posts`. For stricter isolation, add a dedicated RLS policy for `connect_post = true` in a follow-up migration.
