# How to Get Expo to Auto-Generate Credentials

## The Problem
You're in a manual credential setup flow (Step 5 of 8) that doesn't show "Let Expo manage credentials" option.

## Solution: Cancel and Start Build Differently

### Step 1: Cancel Current Flow
1. **Click "Cancel" or "X"** to exit the credential setup wizard
2. Go back to the **Builds page**

### Step 2: Start Build from "Build From GitHub" Button
1. Click **"Build From GitHub"** button (top right)
2. Select:
   - Platform: **iOS**
   - Profile: **production**
   - Branch: **main**
3. **Look for credential options BEFORE clicking confirm:**
   - There might be a checkbox or dropdown for "Credential management"
   - Look for: "Let Expo manage", "Auto-generate", or "Generate automatically"

### Step 3: Alternative - Use EAS CLI Locally
If the dashboard doesn't offer auto-generate, you can run this locally:

```bash
npx eas-cli build --platform ios --profile production
```

When prompted:
- Choose: **"Set up credentials"**
- Then choose: **"Let Expo manage credentials"**

This will create credentials interactively, then future GitHub builds will work.

---

## Why This Happens
The manual credential wizard appears when Expo thinks you want to manage credentials yourself. Starting a build directly (not through the credential setup page) often triggers the auto-generate option.

---

## Quick Action
**Cancel the current flow → Go to Builds → Click "Build From GitHub" → Look for auto-generate option before confirming**
