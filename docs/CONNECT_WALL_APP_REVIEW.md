# Connect post wall — age gate & store review

## What we ship

- **Self-attestation only** (“I am 18+”) stored on-device (`AsyncStorage`). No government ID, no date-of-birth upload in this flow.
- **Same gate for both**: **Connect post wall** (`/open-connect-posts`) and **Open to connect lobby** (`OpenConnectPanel` on Connect tab). One confirmation unlocks both until app data is cleared.
- **Moderation**: existing text/media moderation on posts still applies; the age gate does not replace enforcement.

## Apple App Store

- If reviewers classify the feature as **dating / hookups**, they often expect **17+** (or higher) **age rating** and clear **safety** copy (meet in public, block/report, no harassment). An 18+ attestation is **generally fine** and does not by itself cause rejection.
- **Risk** is UGC + “meet strangers” — mitigate with: reporting, blocking, guidelines in-app, and **accurate** age rating & review notes explaining moderation + safety.
- **Do not** imply the app is “for adults only” globally if the rest of the app is for all ages — scope messaging to the **connect wall** only (as implemented).

## Google Play

- **User-generated content** policies: provide **reporting**, **blocking**, enforcement path, and **content policies** in-app or linked.
- Dating / social-meeting features may draw extra scrutiny; same as Apple: moderation + safety UX matter more than the attestation button itself.

## Not legal advice

Tune copy with your counsel if you operate in jurisdictions with strict age-verification laws for social/dating products.
