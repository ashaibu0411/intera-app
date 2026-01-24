# Fix Failed Builds - Set Up iOS Credentials

## What I See
- ✅ "Build From GitHub" button is visible (top right)
- ❌ Recent builds failed (iOS and Android from 5 minutes ago)
- ❌ Error: "Failed to set up credentials"

## Why Builds Failed
iOS credentials (certificates, provisioning profiles) need to be created **before** GitHub builds can work. GitHub builds are non-interactive, so they can't create credentials automatically.

## Solution: Create Credentials First

### Step 1: Click "Build From GitHub" Button

1. **Click the "Build From GitHub" button** (top right, with GitHub icon)

2. **In the modal that appears:**
   - Select Platform: **iOS** (or start with iOS first)
   - Select Profile: **production**
   - Select Branch: **main**

3. **When it asks about credentials:**
   - Look for: "Configure credentials" or "Let Expo manage credentials"
   - **Choose: "Let Expo manage credentials"** or **"Auto-generate"**
   - This will create credentials automatically

4. **Click "Confirm" or "Create build"**

### Step 2: Wait for Build

- Build will take 10-30 minutes
- You'll get an email when it's done
- Credentials will be saved automatically

### Step 3: After First Successful Build

Once credentials are created:
- ✅ Future GitHub builds will work automatically
- ✅ You can build Android too
- ✅ Automated builds from GitHub Actions will work

---

## Alternative: If Credentials Option Doesn't Appear

If the build starts but fails again with credentials error:

1. **Go to:** https://expo.dev/accounts/znombre04/projects/vibecode/credentials
2. **Or:** Project Settings → Credentials
3. **Set up iOS credentials manually:**
   - Click "Set up credentials" for iOS
   - Choose "Let Expo manage"
   - Follow the prompts

---

## Quick Action

**Click "Build From GitHub" now:**
1. Select iOS → production → main
2. Choose "Let Expo manage credentials" when prompted
3. Wait for build to complete
4. Then all future builds will work!

---

**The button is there - just click it and let Expo create the credentials!**
