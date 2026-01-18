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

