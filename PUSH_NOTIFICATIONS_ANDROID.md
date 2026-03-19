## Android push notifications (FCM) setup

Your Push diagnostics screen shows **Expo push token: (none)**.
That means Android is not registered with Firebase Cloud Messaging (FCM), so Expo cannot generate an Expo push token and **no remote pushes can be delivered**.

### Step 1: Create/download `google-services.json`

In the Firebase Console:
- Add an Android app with package name: `com.vibecode.intera`
- Download `google-services.json`

Place the file here:
- `intera-app/google-services.json`

This repo is already configured to use it via:
- `app.json` → `expo.android.googleServicesFile`

### Step 2: Build a new Android binary (required)

OTA updates cannot add Firebase config. You must create a new Android build:

```powershell
cd intera-app
eas build --platform android --profile production --clear-cache
```

Install that build on your Android device.

### Step 3: Verify

Open the app:
- App Settings → Push diagnostics
- Tap **Sync token now**

You should now see:
- **Expo push token**: `ExponentPushToken[...]`
- **Server token row**: a row in `push_tokens`

Then tap **Send test push** and you should see:
- `tokens` > 0
- `sent` > 0

