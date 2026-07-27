# Auth

Phone number + OTP only — no passwords in Phase 1.

## Flow

1. `POST /api/auth/otp/request` `{ phone }` — generates a 6-digit code, stores a
   bcrypt hash of it on `OtpCode` with a 10-minute expiry, and sends it via SMS.
2. `POST /api/auth/otp/verify` `{ phone, code }` — validates the latest
   unconsumed, unexpired `OtpCode` for that phone, marks it consumed,
   upserts the `User` (+ `Wallet`), and returns a JWT (`signSession`,
   30-day expiry).
3. Mobile app stores the JWT in `flutter_secure_storage` and sends it as
   `Authorization: Bearer <token>` on every subsequent request
   (`ApiClient` interceptor in `mobile/lib/src/core/api/api_client.dart`).

## Admin login

Reuses the same OTP mechanism (`POST /api/admin/login`) but requires the
`User.role` to already be `ADMIN` (set manually in the DB — there's no
self-service admin signup). On success it sets an **httpOnly** cookie
(`admin_session`) instead of returning a bearer token, since the admin
dashboard is a browser session, not a mobile client.

`requireSession` (`web/src/lib/requireSession.ts`) accepts either the
bearer token or the `admin_session` cookie, so the same authorization
helpers work for both mobile API calls and admin dashboard calls.

## Status

- [x] OTP request/verify routes
- [x] JWT issuance + wallet auto-creation on first login
- [x] Admin login (cookie-based)
- [ ] Real SMS provider wired up (`sendOtpSms` currently logs to console
      in dev — see `SMS_PROVIDER_API_KEY` in `.env.example`)
- [ ] Rate limiting on OTP request (needed before launch to prevent abuse)
