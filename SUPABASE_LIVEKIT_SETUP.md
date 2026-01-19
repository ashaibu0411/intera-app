# Supabase + LiveKit (Voice Rooms) — Setup & Deploy

This project uses a Supabase Edge Function named `livekit-token` to mint LiveKit access tokens securely (so your LiveKit API secret never reaches the mobile app).

## 1) Create a LiveKit Cloud project
In LiveKit Cloud:
- Create a project
- Copy these values:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`

## 2) Add secrets in Supabase
Supabase Dashboard → **Edge Functions** → **Secrets**:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

## 3) Deploy the `livekit-token` Edge Function (Windows)
### Requirements
- **Docker Desktop running** (the Supabase CLI uses it to bundle functions on Windows)
- Supabase CLI installed and logged in (`supabase login`)

### Important: you must deploy from a folder that contains `supabase/`
Your deployment folder must include:

```
supabase/
  functions/
    livekit-token/
      index.ts
```

If your local download is missing `supabase/`, you can still deploy by creating a tiny folder that contains only the structure above.

### PowerShell commands
1) Create a minimal deploy folder:

```powershell
mkdir "$HOME\\livekit-deploy" -Force
cd "$HOME\\livekit-deploy"
mkdir "supabase\\functions\\livekit-token" -Force
```

2) Create the function entrypoint file at:
`supabase\functions\livekit-token\index.ts`

3) Deploy:

```powershell
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase functions deploy livekit-token --project-ref <YOUR_PROJECT_REF>
```

If you still get “Entrypoint path does not exist”, it means the file path above does not exist **in the folder you’re currently in**.

## 4) Room recording (optional, for “download the room”)
LiveKit can record rooms via **server-side egress** (recommended). Recording the full room on a single phone is not reliable because it can only capture that device’s audio and is affected by echo cancellation.

Recommended approach (LiveKit Cloud):
- Enable **Egress/Recording** in LiveKit Cloud for your project
- Configure recording output to a storage bucket (S3/GCS/etc.)
- When a host taps “Record room”, your backend starts egress for `provider_room_name`
- When it stops, you store the recording URL in your database and show a “Download” button in the app

If you want, I can add:
- a `voice_room_recordings` table
- a Supabase Edge Function `livekit-recording` to start/stop egress securely
- a simple host UI button in the room to start/stop recording and then download/share the finished file link
