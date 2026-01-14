# Apple Sign-In Troubleshooting Guide

## Error: "The authorization attempt failed for an unknown reason"

This error typically indicates a configuration issue with Apple Sign-In. Follow these steps to diagnose and fix it.

## Step 1: Verify Apple Sign-In Capability is Enabled

1. **Go to Apple Developer Portal:**
   - Visit [developer.apple.com](https://developer.apple.com)
   - Sign in with your Apple Developer account

2. **Check Bundle ID Configuration:**
   - Navigate to **Certificates, Identifiers & Profiles**
   - Click on **Identifiers** in the left sidebar
   - Find your app's Bundle ID (e.g., `com.vibecode.intera` or similar)
   - Click on it to view details

3. **Verify Capability:**
   - Scroll down to **Capabilities**
   - Ensure **Sign in with Apple** is checked/enabled
   - If it's not enabled:
     - Check the box
     - Click **Save**
     - Wait a few minutes for the changes to propagate

## Step 2: Verify App Store Connect Configuration

1. **Go to App Store Connect:**
   - Visit [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Check App Information:**
   - Select your app
   - Go to **App Information**
   - Scroll to **App Capabilities**
   - Ensure **Sign in with Apple** is listed and enabled

## Step 3: Verify Supabase Configuration

1. **Check Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Providers**
   - Ensure **Apple** provider is enabled
   - Verify the **Service ID** and **Team ID** are correctly configured

2. **Verify Service ID:**
   - In Apple Developer Portal, go to **Identifiers**
   - Look for a **Services ID** (not App ID) that's configured for Sign in with Apple
   - This Service ID should match what's configured in Supabase

## Step 4: Create a New Build

**IMPORTANT:** After enabling the capability, you MUST create a new build. The capability must be enabled BEFORE the build is created.

1. **Via Expo/Vibecode:**
   - Go to your Vibecode dashboard
   - Create a new iOS build
   - Wait for the build to complete
   - Upload to TestFlight

2. **Verify Build Includes Capability:**
   - After the build completes, download the `.ipa` file (if possible)
   - Or verify in Xcode that the entitlements include `com.apple.developer.applesignin`

## Step 5: Test Again

1. Install the new build on your device via TestFlight
2. Try signing in with Apple again
3. Check the console logs for more detailed error information

## Common Issues and Solutions

### Issue: Capability enabled but still not working
**Solution:** 
- Ensure you created a NEW build AFTER enabling the capability
- Old builds won't have the capability even if it's enabled now
- Wait 5-10 minutes after enabling before creating a new build

### Issue: Bundle ID mismatch
**Solution:**
- Verify the Bundle ID in `app.json` (or set by Expo) matches exactly with your Apple Developer account
- Check for typos or case sensitivity issues

### Issue: Service ID not configured in Supabase
**Solution:**
- Create a Services ID in Apple Developer Portal
- Configure it for Sign in with Apple
- Add the Services ID to your Supabase Apple provider configuration
- Add the redirect URL from Supabase to your Services ID configuration

### Issue: TestFlight build doesn't have capability
**Solution:**
- The build must be created AFTER the capability is enabled
- Delete the old build and create a new one
- Ensure the build is created through Expo/Vibecode with the latest configuration

## Debugging Steps

If the issue persists, check the console logs:

1. **In the app:**
   - Look for `[Apple Auth]` prefixed logs
   - These will show detailed error information

2. **Common log patterns:**
   - `signInAsync error:` - Shows the raw error from Apple's SDK
   - `Availability check failed:` - Indicates the capability might not be available
   - `Supabase error:` - Indicates an issue with Supabase configuration

## Next Steps

If you've completed all steps above and the issue persists:

1. **Check the console logs** for the detailed error message
2. **Verify the Bundle ID** matches exactly between:
   - Apple Developer Portal
   - App Store Connect
   - Your app configuration
3. **Contact Support** with:
   - The exact error message from the logs
   - Screenshot of your Apple Developer capability settings
   - Bundle ID being used

## Additional Resources

- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Expo Apple Authentication Plugin](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Supabase Apple Provider Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
