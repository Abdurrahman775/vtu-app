# Auth

Email + OTP only — no passwords, and no phone number, anywhere in the
login/signup flow. Email is the sole identifier. `User.phone` still
exists in the schema (nullable) purely because wallet-to-wallet
transfers look up a recipient by phone (`docs/TRANSFER.md`) — it's
never collected or required at signup, and most new accounts will have
it as `null`.

## Flow

1. `POST /api/auth/otp/request` `{ email }` — generates a 6-digit code,
   stores a bcrypt hash of it on `OtpCode` with a 10-minute expiry, and
   emails it via Gmail SMTP.
2. `POST /api/auth/otp/verify` `{ email, code }` — validates the latest
   unconsumed, unexpired `OtpCode` for that email, marks it consumed. If
   no `User` exists for that email yet, one is created (with a `Wallet`)
   on the spot — no other field required. Returns a JWT (`signSession`,
   30-day expiry).
3. Mobile app stores the JWT in `flutter_secure_storage` and sends it as
   `Authorization: Bearer <token>` on every subsequent request
   (`ApiClient` interceptor in `mobile/lib/src/core/api/api_client.dart`).

## Email delivery

`sendOtpEmail()` (`web/src/lib/otp.ts`) sends via Gmail SMTP using
`nodemailer`, configured with `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
`SMTP_PASS` (see `.env.example`). `SMTP_PASS` must be a Google Account
**App Password** (myaccount.google.com/apppasswords) — Gmail rejects the
account's normal login password for SMTP auth, and app passwords
require 2-Step Verification to be enabled first.

While `SMTP_USER`/`SMTP_PASS` are unset, two dev-only shortcuts kick in
(both in `web/src/lib/otp.ts`, gated on the same `isSmtpConfigured()`
check so neither can silently ship to a real deployment):

- `generateOtpCode()` returns a fixed code, `123456`, instead of a
  random one, so local testing doesn't require reading the server
  console for every login.
- `sendOtpEmail()` logs `[dev] OTP for <email>: <code>` to the server
  console instead of sending a real email.

## Admin login

Reuses the same OTP mechanism (`POST /api/admin/login` `{ email, code
}`) but requires the `User.role` to already be `ADMIN` (set manually in
the DB — there's no self-service admin signup). On success it sets an
**httpOnly** cookie (`admin_session`) instead of returning a bearer
token, since the admin dashboard is a browser session, not a mobile
client.

`requireSession` (`web/src/lib/requireSession.ts`) accepts either the
bearer token or the `admin_session` cookie, so the same authorization
helpers work for both mobile API calls and admin dashboard calls.

## Status

- [x] OTP request/verify routes, keyed by email only — no phone
      collected or required anywhere in login/signup
- [x] JWT issuance + wallet auto-creation on first login
- [x] Admin login (cookie-based, email-keyed)
- [x] Gmail SMTP wired up via `nodemailer` (`web/src/lib/otp.ts`) — falls
      back to a static dev code + console log until `SMTP_USER`/
      `SMTP_PASS` are set
- [x] Rate limiting on OTP request — `checkOtpRateLimit`
      (`web/src/lib/otp.ts`) caps requests to 10 per email per
      15-minute window using the existing `OtpCode` rows, no separate
      store needed; returns `429` once exceeded
