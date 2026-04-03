# Business SMS alerts for new appointments

When a customer completes a booking, the app already sends a **push notification** to the business **owner’s Intera account**. This adds an optional **SMS** to the **phone number saved on the business listing** (`businesses.phone` — the same field used in the directory / “call business”).

## Already using Twilio for phone signup / profile?

Phone verification uses **Supabase Authentication → Phone** (often backed by Twilio). That is **one Twilio account**—you do **not** need a second account for appointment SMS.

Important: **Auth provider secrets live only in the Auth settings.** Edge Functions cannot read them. For `send-appointment-sms`, add secrets on the function with the **same** Twilio **Account SID** and **Auth Token** you use in Auth → Phone, plus a **From** number in E.164 (usually the same SMS-capable number or compatible sender you use for OTP).

## Requirements

1. **Twilio** account with an SMS-capable number (can be the same as phone auth).
2. Deploy the Edge Function **`send-appointment-sms`**.
3. Set secrets on the function (Supabase Dashboard → **Edge Functions** → **send-appointment-sms** → **Secrets**):

| Secret | Example |
|--------|--------|
| `TWILIO_ACCOUNT_SID` | From Twilio Console (same as Auth → Phone) |
| `TWILIO_AUTH_TOKEN` | From Twilio Console (same as Auth → Phone) |
| `TWILIO_SMS_FROM` | Long code in **E.164**, e.g. `+15551234567`, **or** the **From** value Twilio expects for a short code (see below) |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional alternative: Twilio **Messaging Service** SID (`MG…`). Prefer this for **multi-country** sending. |

You can use **`TWILIO_PHONE_NUMBER`** or **`TWILIO_FROM_NUMBER`** instead of `TWILIO_SMS_FROM` if you prefer that naming.

**Short codes & “global”**

- There is **no single short code that works worldwide**. Short codes are **approved per country** (and sometimes per operator). A US short code does not deliver SMS in France, etc.
- If Twilio gave you a **short code**, use it as **`From`** only in the format Twilio documents for that country (often **not** a full `+` E.164 string—e.g. US may be a 5–6 digit code). Put that exact value in `TWILIO_SMS_FROM` (or the alternate env names).
- For a **global** product, the usual approach is a **Twilio Messaging Service** (`MG…`): attach **regional** long codes and/or **country-specific** short codes; set **`TWILIO_MESSAGING_SERVICE_SID`** and **omit** a single global `From`. The function now supports **`TWILIO_MESSAGING_SERVICE_SID`** + `To` + `Body` (Twilio chooses the sender from the service).

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` are usually injected automatically.

## Deploy

```bash
cd intera-app
supabase functions deploy send-appointment-sms
```

## Behavior

- Invoked from the app **after** an appointment is created, with `{ appointmentId }`.
- The function checks that the **logged-in user is the customer** on that appointment (prevents random SMS spam).
- If **Twilio secrets are missing** → returns success with `skipped: twilio_not_configured` (app keeps working).
- If **business has no `phone`** or it can’t be normalized to E.164 → `skipped: no_business_phone`.
- **US-centric normalization**: 10-digit numbers get `+1`; numbers starting with `+` are cleaned to digits.

## Business setup

Businesses should enter a **real mobile or SMS-capable number** in their profile (same as directory phone). Owners should comply with **TCPA / consent** rules for their jurisdiction.

## Cost

Twilio charges per SMS; monitor usage in the Twilio Console.

---

## WhatsApp (Twilio) instead of SMS

WhatsApp uses the **same** Twilio Account SID + Auth Token, but **different** addressing: `From` and `To` must look like `whatsapp:+15551234567` (the function does this when WhatsApp mode is on).

**“Global” with WhatsApp:** Many countries use WhatsApp, but delivery still follows **Meta’s rules** (Business account, display name, opt-in, and often **message templates** for business-initiated alerts). It is **not** a separate secret per country in Supabase—your Twilio/Meta setup defines where you can send.

### Secrets (pick one pattern)

**A — WhatsApp sender number (simple)**

| Secret | Value |
|--------|--------|
| `TWILIO_ACCOUNT_SID` | `AC…` |
| `TWILIO_AUTH_TOKEN` | Auth token |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+…` matching the WhatsApp-enabled sender Twilio shows (E.164 after `whatsapp:`). You can also set `+15551234567` and the function will normalize to `whatsapp:+15551234567`. |

Do **not** set `TWILIO_SMS_FROM` for this path unless you switch back to SMS (remove `TWILIO_WHATSAPP_FROM` to use SMS again).

**B — Messaging Service that includes WhatsApp**

| Secret | Value |
|--------|--------|
| `TWILIO_ACCOUNT_SID` | `AC…` |
| `TWILIO_AUTH_TOKEN` | Auth token |
| `TWILIO_MESSAGING_SERVICE_SID` | `MG…` (service must include your **WhatsApp** sender in Twilio) |
| `TWILIO_WHATSAPP` | `1` or `true` |

The function then sends with `To=whatsapp:+…` and lets the service pick the WhatsApp sender.

### Sandbox vs production

- **Sandbox:** Users must **join** your sandbox (Twilio sends the join code flow). `businesses.phone` must be the same number they use on WhatsApp.
- **Production:** Complete Meta Business / WhatsApp approval in Twilio. Outbound **booking alerts** may need an approved **template**—if Twilio returns template errors, implement Twilio **Content API / template** sends next (not in the default `Body`-only path).

### Deploy after changing code

```bash
cd intera-app
supabase functions deploy send-appointment-sms
```
