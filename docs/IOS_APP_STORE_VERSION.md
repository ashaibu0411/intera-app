# iOS App Store — version before every store build

Apple rejects uploads when:

- **`CFBundleShortVersionString`** (`expo.version` in `app.json`) is **not higher** than the last **approved** App Store version → error **90062**.
- The **version train** in App Store Connect is **closed** (e.g. 2.0.7 already shipped) → error **90186**.

## Before `eas build --platform ios` (production / TestFlight)

1. **Bump `expo.version`** in `app.json` so it is **greater than** the latest version users can download from the App Store (e.g. `2.0.7` → `2.0.8`).
2. In **App Store Connect**, create or select a **new app version** that matches this number (open a new train if the old one is closed).
3. Run the iOS build; **`ios.buildNumber`** is auto-incremented by EAS when `autoIncrement` is enabled in `eas.json` (separate from the marketing version).

**Remember:** Android `versionCode` and iOS **marketing version** are independent rules — but **`expo.version` is shared**, so a bump applies to both platforms’ user-facing version strings.
