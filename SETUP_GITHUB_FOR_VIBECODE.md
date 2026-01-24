# Setup GitHub Builds for @znombre04/vibecode

## ✅ What's Complete

1. **Code Pushed to GitHub** ✅
   - `eas.json` configured
   - `app.json` with iOS bundleIdentifier
   - GitHub Actions workflow created
   - Project ID: `090ff57c-7051-4df7-b53e-60eaa2cfe0f6`

2. **Environment Variables** ✅
   - Already set up for this project
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_ANON_KEY

## Next Steps

### Step 1: Connect GitHub in Expo Dashboard

1. **Go to your project:**
   - https://expo.dev/accounts/znombre04/projects/vibecode

2. **Find GitHub Integration:**
   - Look for "Integrations" or "GitHub" in the left sidebar
   - Or go to: https://expo.dev/accounts/znombre04/projects/vibecode/integrations

3. **Connect GitHub:**
   - Click "Connect GitHub" or "Add GitHub Integration"
   - Authorize Expo
   - Select repository: `ashaibu0411/intera-app`
   - Select branch: `main`
   - Click "Connect"

### Step 2: Set Up iOS Credentials (First Build)

**Option A: Via Expo Dashboard (Easiest)**
1. Go to: https://expo.dev/accounts/znombre04/projects/vibecode/builds
2. Click "Create a build"
3. Select: iOS → production
4. When asked about credentials: **"Let Expo manage credentials"**
5. Expo will create them automatically

**Option B: Via Command Line**
```bash
npx eas-cli credentials
```
Then select iOS → production → Let Expo handle it

### Step 3: Build from GitHub

After credentials are set up:

1. **Go to:** https://expo.dev/accounts/znombre04/projects/vibecode/builds
2. **Click:** "Start a build from GitHub"
3. **Select:**
   - Platform: iOS, Android, or Both
   - Profile: production
   - Branch: main
4. **Click:** "Confirm"

### Step 4: Set Up Automated Builds (Optional)

1. **Get Expo Token:**
   - https://expo.dev/accounts/znombre04/settings/access-tokens
   - Create token named `github-actions`
   - Copy the token

2. **Add to GitHub Secrets:**
   - https://github.com/ashaibu0411/intera-app/settings/secrets/actions
   - New secret: `EXPO_TOKEN`
   - Value: Your Expo token
   - Add secret

3. **Test:**
   - Push to `main` → Builds automatically
   - Or: https://github.com/ashaibu0411/intera-app/actions → Run workflow

---

## Your Project Info

- **Expo Project:** `@znombre04/vibecode`
- **Project ID:** `090ff57c-7051-4df7-b53e-60eaa2cfe0f6`
- **GitHub:** `ashaibu0411/intera-app`
- **Branch:** `main`

---

## Quick Links

- **Expo Dashboard:** https://expo.dev/accounts/znombre04/projects/vibecode
- **Builds:** https://expo.dev/accounts/znombre04/projects/vibecode/builds
- **GitHub Repo:** https://github.com/ashaibu0411/intera-app
- **GitHub Actions:** https://github.com/ashaibu0411/intera-app/actions

---

**Everything is ready!** Just connect GitHub in Expo Dashboard and set up credentials for your first build.
