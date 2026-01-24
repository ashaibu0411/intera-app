# Set Up iOS Credentials Locally (Interactive)

## The Problem
GitHub builds can't auto-generate credentials (non-interactive). You need to create credentials first using the interactive EAS CLI.

## Solution: Run EAS Build Locally

### Step 1: Run This Command
Open your terminal and run:

```bash
npx eas-cli build --platform ios --profile production
```

### Step 2: When Prompted
The CLI will ask you questions interactively:

1. **"Do you want to log in to your Apple account?"**
   - Answer: **Yes** (this allows Expo to auto-generate credentials)

2. **"Set up credentials?"**
   - Answer: **Yes**

3. **"How would you like to upload your credentials?"**
   - Choose: **"Let Expo manage credentials"** or **"Auto-generate"**

4. **Apple ID Login:**
   - Enter your Apple ID email
   - Enter your Apple ID password
   - If you have 2FA, you'll need to generate an app-specific password

### Step 3: Wait for Build
- Credentials will be created and saved
- Build will start automatically
- Takes 10-30 minutes

### Step 4: After First Build
- ✅ Credentials are now saved in Expo
- ✅ Future GitHub builds will work automatically
- ✅ You can cancel this build if you want (credentials are already saved)

---

## Alternative: If You Don't Have Apple Developer Account

If you don't have an Apple Developer account ($99/year):
- You can't build for App Store
- You can build for simulator only
- Or use Expo's development builds

---

## Quick Action
**Run this in your terminal:**
```bash
npx eas-cli build --platform ios --profile production
```

Then choose "Let Expo manage credentials" when prompted!
