# Set Up iOS Credentials for GitHub Builds

## The Problem
GitHub builds are "non-interactive" - they can't ask you questions. So iOS credentials must be set up **before** you can build from GitHub.

## Solution: Set Up Credentials First

### Option 1: Build from Expo Dashboard (Easiest - Creates Credentials Automatically)

1. **Go to:** https://expo.dev/accounts/znombre04/projects/vibecode/builds

2. **Click "Create a build"** (or look for any build button)

3. **Select:**
   - Platform: **iOS**
   - Profile: **production**

4. **When asked about credentials:**
   - Choose **"Let Expo manage credentials"** or **"Auto-generate"**
   - Expo will create and save them automatically

5. **After first build completes:**
   - Credentials are saved
   - Future GitHub builds will work automatically!

### Option 2: Set Up Credentials via Command Line (If Dashboard Doesn't Work)

Since the command line needs interactive mode, you'll need to run this on your **local computer** (not in Cursor terminal):

```bash
npx eas-cli credentials
```

Then:
1. Select **iOS**
2. Select **production** profile
3. Choose **"Set up credentials"** or **"Let Expo handle it"**
4. Follow the prompts

---

## Why This Is Needed

- **First iOS build** → Needs credentials
- **GitHub builds** → Non-interactive, so credentials must exist first
- **After first build** → Credentials are saved, all future builds work

---

## Quick Fix: Use Expo Dashboard

**The easiest way is to create your first build from the Expo Dashboard:**
1. It will create credentials automatically
2. Then GitHub builds will work

---

## After Credentials Are Set Up

Once credentials exist, you can:
- ✅ Build from GitHub (automated)
- ✅ Build from command line
- ✅ Build from Dashboard

All will work because credentials are saved!

---

**Try creating a build from Expo Dashboard first - it's the easiest way to set up credentials!**
