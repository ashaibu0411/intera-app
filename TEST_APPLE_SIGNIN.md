# Testing Apple Sign-In with Development Build

Since you have an Expo build ready, here's how to test Apple Sign-In without submitting to the App Store.

## Important Notes

⚠️ **Apple Sign-In requires:**
- A **physical iOS device** (does NOT work in iOS Simulator)
- The device must be **signed in with an Apple ID** in Settings
- A **development build** (not Expo Go - Apple Sign-In doesn't work in Expo Go)

## Steps to Test

### Option 1: If you have a Development Build ready (Recommended)

1. **Install the build on your iPhone/iPad:**
   - If you built through Vibecode/EAS, download the `.ipa` file
   - Install via:
     - **TestFlight** (if uploaded)
     - **Direct installation** via Xcode (drag .ipa to Devices window)
     - **OTA (Over-The-Air)** if you have a distribution link

2. **Make sure your device is set up:**
   - Device is signed in with Apple ID in Settings → [Your Name]
   - Device is connected to internet
   - Development build is installed

3. **Test Apple Sign-In:**
   - Open the app
   - Navigate to the sign-up/sign-in screen
   - Tap "Sign in with Apple"
   - You should see the Apple Sign-In modal
   - Complete the sign-in flow

### Option 2: Build a new Development Build locally

If you don't have a development build yet:

```bash
# Make sure you have Xcode installed
# Build for development
npx expo run:ios --device

# This will:
# 1. Build the app for your connected device
# 2. Install it automatically
# 3. Launch the app
```

**Requirements:**
- Xcode installed
- iOS device connected via USB
- Device registered in Apple Developer account
- Development team/certificate configured

### Option 3: Build with EAS Build (Cloud)

If you prefer cloud builds:

```bash
# Install EAS CLI (if not installed)
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build development build for iOS
eas build --platform ios --profile development
```

Then download and install the `.ipa` file on your device.

## Troubleshooting Apple Sign-In

### "Apple Sign-In is not configured properly"
- Make sure "Sign in with Apple" capability is enabled in your Apple Developer account for the bundle ID
- Check that `expo-apple-authentication` plugin is in `app.json` (already configured ✅)

### "Apple Sign-In failed"
- Make sure you're testing on a **physical device** (not simulator)
- Device must be signed in with Apple ID in Settings
- Check that the bundle ID matches your Apple Developer configuration

### Button doesn't appear
- Check console logs for errors
- Verify `Platform.OS === 'ios'` check is working
- Make sure you're not testing in Expo Go (use development build)

### Build errors
- Make sure `expo-apple-authentication` plugin is configured
- Check that iOS deployment target is 15.1+ (already set ✅)
- Verify all dependencies are installed: `npm install`

## What to Expect

When testing Apple Sign-In, you should see:

1. **Apple Sign-In button appears** (only on iOS devices)
2. **Tap the button** → Apple Sign-In modal appears
3. **Choose to share email** or "Hide My Email"
4. **Sign in** → App receives credentials
5. **User is signed in** → Redirected to main app

## Testing Checklist

- [ ] Physical iOS device available
- [ ] Device signed in with Apple ID
- [ ] Development build installed
- [ ] App opens and shows sign-up screen
- [ ] "Sign in with Apple" button is visible
- [ ] Tapping button shows Apple Sign-In modal
- [ ] Can complete sign-in flow
- [ ] User is successfully authenticated
- [ ] App redirects to main screen after sign-in

## Next Steps After Testing

Once Apple Sign-In works in development build:

1. ✅ Verify all flows work correctly
2. ✅ Test with different Apple IDs
3. ✅ Test "Hide My Email" option
4. ✅ Test error scenarios (cancellation, network issues)
5. ✅ When ready, build production version for App Store submission

## Quick Command Reference

```bash
# Build development build for connected device
npx expo run:ios --device

# Build with EAS (cloud)
eas build --platform ios --profile development

# Start development server (for hot reload after build)
npm start

# Check if device is connected
xcrun simctl list devices  # For simulator
xcrun xctrace list devices # For physical devices
```
