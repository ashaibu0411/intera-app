# EAS Update & TestFlight / iOS stability

## Crash: `expo.controller.errorRecoveryQueue` + SIGABRT

If the device log shows:

- **Queue:** `expo.controller.errorRecoveryQueue`
- **Exception:** `EXC_CRASH` / `SIGABRT` / `abort() called`
- **Last exception** touching your app binary then `objc_exception_throw`

that is **Expo Updates error recovery** (native) aborting — often after a **failed or incompatible OTA**, or a bug in the recovery path. It is **not** the same as a normal JS redbox.

**Mitigation in this repo:** `app.config.js` sets **`updates.enabled: false`** for **EAS iOS builds** (`EAS_BUILD_PLATFORM=ios`) so TestFlight binaries do not run that OTA stack. Android keeps EAS Update from `app.json`.

To ship iOS **with** OTA again (when ready):  
`FORCE_IOS_OTA=1 eas build --platform ios`  
and confirm on a **release** iOS version (avoid depending on beta OS-only behavior).

---

## Why the app could “crash” right after enabling OTA

1. **`fallbackToCacheTimeout` too high**  
   If this is &gt; `0`, the native layer can **wait** for the update server **before** showing your UI. A long wait (e.g. 10s) plus splash can look like a hang; iOS may **terminate** the app (watchdog / unresponsive launch).  
   **Fix:** keep **`fallbackToCacheTimeout: 0`** so the embedded bundle loads immediately; update checks continue in the background.

2. **`expo-updates` config plugin**  
   Include **`"expo-updates"`** in the `plugins` array in `app.json` so iOS/Android get the correct `EXUpdates*` / manifest settings on each prebuild.

3. **A bad published JS update**  
   If `eas update` shipped a **broken bundle** (runtime error on launch), **every** TestFlight user on that runtime can crash on startup.  
   **Fix:** in [expo.dev](https://expo.dev) → your project → **Updates**, **roll back** the bad deployment or publish a **fix** update for the same **runtime version** and channel (`production`).

4. **Runtime / channel mismatch**  
   With `runtimeVersion: { "policy": "appVersion" }`, the runtime string is **`expo.version`** (e.g. `2.0.8`). Only publish updates for that runtime after a **store** version bump, or use the **`fingerprint`** policy if you prefer Expo to compute compatibility.

## Safer pattern (optional)

- Keep **`fallbackToCacheTimeout: 0`**.  
- If you still see issues, set **`checkAutomatically`** to **`NEVER`** and manually call `Updates.checkForUpdateAsync()` / `fetchUpdateAsync()` **after** the app has mounted (e.g. after hiding splash).

## Quick reference

| Symptom | Likely cause | Action |
|--------|----------------|--------|
| Freeze on splash after OTA | Long `fallbackToCacheTimeout` | Set to `0`, rebuild native app |
| Crash only after publishing an update | Bad OTA bundle | Roll back or ship fix update |
| Crash on fresh install | Native / config issue | Ensure `expo-updates` plugin + valid `updates.url` + `runtimeVersion` |
