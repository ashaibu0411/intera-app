# Live radio — what to build for production

## Done in the app (baseline)

- **One station** — `PRIMARY_RADIO_STATION` in `src/lib/radioService.ts` (edit copy/images there).
- **Stream URL** — `EXPO_PUBLIC_RADIO_STREAM_URL` in `.env` (see `.env.example`).
- **Real playback** with **`expo-av`** — play / pause / mute; stream stops when you **leave** the Live Radio screen (no background audio yet).

## Still to build (typical product)

| Area | What |
|------|------|
| **Catalog** | When you add more stations, move list to **Supabase** (or CMS): `id`, `name`, `stream_url`, `is_live`, artwork, etc. |
| **Host onboarding** | “Create station” flow: form for stream URL + metadata; optional **admin approval** before listing. |
| **Now playing** | Poll **Icecast status JSON** (`/status-json.xsl`) or your host’s API; update `currentTrack` / `listenerCount` in DB or edge function. |
| **Live chat** | Replace mock messages with **realtime** (Supabase channel or dedicated chat service); moderation + rate limits. |
| **Share** | `Share.share({ url: streamUrl, message: 'Listen on Intera' })` + deep link to `live-radio` with `?station=id`. |
| **Background audio** | `app.json` → iOS **Audio** background mode; `Audio.setAudioModeAsync({ staysActiveInBackground: true })`; consider **lock screen / notification** controls (`expo-av` + app config). |
| **Android** | Foreground service for long playback (policy); test **HTTP vs HTTPS** and battery optimizations. |
| **Legal** | Music licensing (ASCAP/BMI/etc.) if not fully owned content; terms for hosts. |

## Without the app

Listeners can still use the **same `streamUrl`** in a browser, VLC, or an embed on the station’s website — the app is not required for the audio itself.
