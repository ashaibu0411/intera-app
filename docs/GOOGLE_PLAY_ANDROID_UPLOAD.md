# Google Play — Android upload checklist (Intera)

## 1. Use the right **artifact** (most common mistake)

| EAS profile      | Android output | OK for Play Store production?      |
|-----------------|----------------|-------------------------------------|
| **`production`** | **`.aab`** (App Bundle) | **Yes** — use this for Production / internal testing tracks that require bundles |
| **`preview`**    | **`.apk`**     | Often **rejected** or wrong for Production; use for sideload / internal APK testing only |
| **`development`**| **`.apk`**     | **No** — dev client only            |

**Command for store uploads:**

```bash
cd intera-app
eas build --platform android --profile production
```

Download the **`.aab`** from the Expo build page (not an APK).

---

## 2. Match Play Console app identity

- **Application ID** in this project: **`com.vibecode.intera`** (`app.json` → `expo.android.package`).
- The app entry in [Google Play Console](https://play.google.com/console) must be **the same package name**.
- If Play has a **different** package, you cannot upload this AAB to that listing — create a new app or fix the package in config (requires care / may need new listing).

---

## 3. Signing key

- EAS **production** uses the **upload keystore** stored in Expo (EAS credentials).
- If Play says **wrong key** / **not signed with upload certificate**:
  - In Play Console → **Setup → App signing**, confirm you’re using the **upload key** EAS expects, or reset upload key per Google’s flow and update EAS credentials.

---

## 4. Version code

- Each upload must have a **higher `versionCode`** than any version already in Play.
- This project uses **`autoIncrement: true`** in `eas.json` for production; EAS bumps `expo.android.versionCode` in `app.json` at build time.
- If you build locally or copy an old `app.json`, bump **`versionCode`** manually before uploading.

---

## 5. Typical Play Console messages

| Message | What to do |
|--------|------------|
| **16 KB memory page sizes** | Fix native alignment (Skia, MMKV removed, NDK, `useLegacyPackaging: false`, etc.) — see team notes / App Bundle Explorer. |
| **Target API level** | `targetSdkVersion` / `compileSdkVersion` are **35** in `expo-build-properties` — should meet current Play requirements. |
| **You need to use an App Bundle** | You uploaded an **APK**; rebuild with **`production`** (`.aab`). |
| **Version code X has already been used** | Bump `versionCode` and rebuild. |
| **No devices supported** / compatibility | Rare; check **minSdk** (24), Play pre-launch reports, and any device exclusions in Console. |

---

## 6. Submit from CLI (optional)

```bash
cd intera-app
eas submit --platform android --profile production --latest
```

Requires Play Console **service account** JSON linked in Expo (Submit credentials).

---

If upload still fails, copy the **exact** red error text from Play Console (English) and which track (Internal / Closed / Production) you’re using.
