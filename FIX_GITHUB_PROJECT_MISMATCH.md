# Fix GitHub Project Mismatch

## The Problem
Your GitHub repository is connected to a different Expo project than the one you're working with:

- **Your Project:** `@znombre04/vibecode` (ID: `090ff57c-7051-4df7-b53e-60eaa2cfe0f6`)
- **GitHub-Connected Project:** ID: `37e50fab-c3cc-4a10-b6f8-7df3560140f0` (different project)

## Solution: Reconnect GitHub to the Correct Project

### Step 1: Disconnect GitHub from Wrong Project

1. **Find the wrong project:**
   - Go to: https://expo.dev/accounts/znombre04/projects
   - Look for a project that shows "GitHub" connected
   - It might be named `intera-community-app` or similar

2. **Disconnect GitHub:**
   - Go to that project's page
   - Find "Integrations" or "GitHub" in sidebar
   - Click "Disconnect" or remove the GitHub connection

### Step 2: Connect GitHub to Your Project

1. **Go to your correct project:**
   - https://expo.dev/accounts/znombre04/projects/vibecode

2. **Connect GitHub:**
   - Click "Integrations" or "GitHub" in sidebar
   - Click "Connect GitHub"
   - Authorize Expo
   - Select: `ashaibu0411/intera-app`
   - Select branch: `main`
   - Click "Connect"

### Step 3: Verify Connection

After connecting, the project ID in `app.json` should match. Your current `app.json` already has the correct project ID (`090ff57c-7051-4df7-b53e-60eaa2cfe0f6`), so once GitHub is connected to the right project, it should work!

---

## Alternative: Update Project ID (If You Want to Use GitHub-Connected Project)

If you prefer to use the GitHub-connected project instead:

1. **Update app.json:**
   - Change project ID to: `37e50fab-c3cc-4a10-b6f8-7df3560140f0`
   - Change slug to match that project

2. **Add environment variables to that project**

But I recommend **reconnecting GitHub to your current project** instead!

---

## Quick Steps Summary

1. ✅ Disconnect GitHub from wrong project
2. ✅ Go to: https://expo.dev/accounts/znombre04/projects/vibecode
3. ✅ Connect GitHub there
4. ✅ Select: `ashaibu0411/intera-app` → `main`
5. ✅ Try building again

---

**Your app.json is correct!** Just need to connect GitHub to the right project.
