# Quick Steps: Testing on Your iPhone

## Do You Have a Build File?

### ✅ YES - You have a .ipa file or download link:

**Install via Xcode (Easiest):**
1. Connect iPhone to Mac via USB
2. Open Xcode
3. Press `Shift + Cmd + 2` (or Window → Devices and Simulators)
4. Select your iPhone from the left sidebar
5. Drag the `.ipa` file into the "Installed Apps" area
6. Wait for installation (may take 1-2 minutes)

**Install via TestFlight:**
1. Download TestFlight app from App Store (if not installed)
2. Open TestFlight
3. Tap the invite link or scan QR code
4. Tap "Install" to install the app

**Then:**
- Open the app on your iPhone
- Go to sign-up screen
- Tap "Sign in with Apple"
- Test the flow!

### ❌ NO - You need to create a build:

**Option 1: Build via Vibecode Dashboard**
1. Go to Vibecode dashboard
2. Navigate to Build/Publish section
3. Select iOS → Development Build
4. Start the build
5. Wait for completion (usually 10-20 minutes)
6. Download the .ipa file
7. Follow installation steps above

**Option 2: Build locally (if you have Xcode)**
```bash
# Connect iPhone via USB
# Run this command:
npx expo run:ios --device

# This will:
# - Build the app
# - Install it on your connected iPhone
# - Launch the app automatically
```

## Quick Checklist

Before testing:
- [ ] iPhone is connected to internet
- [ ] iPhone is signed in with Apple ID (Settings → [Your Name])
- [ ] Build is installed on iPhone
- [ ] App opens successfully

When testing:
- [ ] "Sign in with Apple" button appears
- [ ] Tapping button shows Apple Sign-In modal
- [ ] Can complete sign-in
- [ ] User is authenticated successfully

## Need Help?

- **Build failed?** Check that "Sign in with Apple" capability is enabled in Apple Developer account
- **Can't install?** Make sure your iPhone is trusted (tap "Trust" when prompted)
- **Button doesn't appear?** Make sure you're using a development build (not Expo Go)
- **Apple Sign-In fails?** Check device is signed in with Apple ID in Settings
