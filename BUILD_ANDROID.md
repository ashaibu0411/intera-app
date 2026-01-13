# Building Android APK Locally

This guide will help you build an Android APK locally for testing and Google Play Store submission.

## Prerequisites

Before building, you need to install:

1. **Java JDK 17 or higher**
   - Download from: https://adoptium.net/
   - Verify: `java -version`

2. **Android Studio** (includes Android SDK)
   - Download from: https://developer.android.com/studio
   - Install Android SDK Platform 35 and Build Tools 35.0.0
   - Set `ANDROID_HOME` environment variable:
     - **Linux/Mac**: `export ANDROID_HOME=$HOME/Android/Sdk`
     - **Windows**: `set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`
   - Add to PATH: `$ANDROID_HOME/platform-tools` and `$ANDROID_HOME/tools`

3. **Node.js and npm** (already installed)

## Build Steps

### Step 1: Generate Native Android Project

This creates the `android/` folder with native code:

```bash
npm run prebuild:android
```

Or to clean and regenerate:

```bash
npm run prebuild:clean
```

### Step 2: Build the APK

#### For Testing (Debug APK):
```bash
npm run android:build:debug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### For Release (Production APK):
```bash
npm run android:build
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

**Note**: For release builds, you'll need to configure signing. See "Signing the APK" below.

### Step 3: Build AAB (Android App Bundle) for Google Play

For Google Play Store submission, you need an AAB file:

```bash
npm run android:build:apk
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Signing the APK/AAB

For Google Play Store, you need to sign your app. Here's how:

### 1. Generate a Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Save the keystore file and password securely! You'll need it for all future updates.

### 2. Create `android/keystore.properties`

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=my-key-alias
storeFile=../my-release-key.keystore
```

### 3. Update `android/app/build.gradle`

Add signing config (if not already present):

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

## Quick Build Commands

```bash
# Generate Android native code
npm run prebuild:android

# Build debug APK (for testing)
npm run android:build:debug

# Build release APK (for distribution)
npm run android:build

# Build release AAB (for Google Play)
npm run android:build:apk
```

## Troubleshooting

### "ANDROID_HOME not set"
- Set the environment variable (see Prerequisites)
- Restart your terminal

### "Gradle build failed"
- Make sure Java JDK 17+ is installed
- Check Android SDK is properly installed
- Try: `cd android && ./gradlew clean`

### "SDK location not found"
- Open Android Studio
- Go to Settings → Appearance & Behavior → System Settings → Android SDK
- Copy the SDK location and set `ANDROID_HOME`

### Build takes too long
- First build downloads dependencies (can take 10-20 minutes)
- Subsequent builds are much faster

## Testing the APK

1. Enable "Developer Options" on your Android device
2. Enable "USB Debugging"
3. Connect device via USB
4. Install: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

Or use:
```bash
npm run android:install
```

## Uploading to Google Play Store

1. Build the AAB: `npm run android:build:apk`
2. Go to Google Play Console: https://play.google.com/console
3. Create a new app (if first time)
4. Go to "Production" → "Create new release"
5. Upload the AAB file from: `android/app/build/outputs/bundle/release/app-release.aab`
6. Fill in release notes and submit for review

## Notes

- The `android/` folder is generated and can be regenerated anytime
- Don't commit the `android/` folder to git (it's in `.gitignore`)
- Keep your keystore file secure and backed up
- Each release needs a new `versionCode` in `app.json`
