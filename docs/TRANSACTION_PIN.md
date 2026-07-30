# Transaction PIN

A 4-digit PIN, separate from the email+OTP login flow, that gates money
movement: wallet-to-wallet transfer and every purchase (airtime, data,
cable, exam pin, electricity). **Optional by design** — not collected at
signup, same reasoning as phone number's move from required to optional
(`docs/AUTH.md`): the mobile Profile screen is where a user sets one,
and once set, it's required on every subsequent transfer/purchase.
Before it's set, transactions proceed without a PIN — an account
existing before this feature shipped isn't retroactively locked out.

## Data model

`User.pinHash` (`web/prisma/schema.prisma`) — a bcrypt hash, nullable.
`hasPin` in `GET /api/me`'s response (`user.pinHash !== null`) is how
the mobile app knows whether to prompt for a PIN before submitting a
transaction, and whether the Profile screen should offer "Set" or
"Change".

## Routes

- `POST /api/me/pin` `{ currentPin?, newPin }` — sets a PIN for the
  first time, or changes an existing one. `currentPin` is only checked
  if the account already has one (401 `"Current PIN is incorrect"` if
  wrong); a fresh PIN needs no `currentPin`. `newPin` must be exactly 4
  digits (400 otherwise).
- Every purchase/transfer route (`POST /api/wallet/transfer`,
  `/api/airtime/purchase`, `/api/data/purchase`, `/api/cable/purchase`,
  `/api/exam-pin/purchase`, `/api/electricity/purchase`) now accepts an
  optional `pin` field, checked via `checkTransactionPin()`
  (`web/src/lib/pin.ts`) right after the request body is parsed and
  before any wallet/pricing logic runs. Returns `401 { error: "Incorrect
  transaction PIN", code: "PIN_INCORRECT" }` if the account has a PIN
  set and the submitted one doesn't match (or wasn't provided at all),
  or `423 { error: "...", code: "PIN_LOCKED" }` if it's locked out (see
  Lockout below). `web/src/app/api/electricity/verify-meter/route.ts`
  does **not** check a PIN — it's a read-only lookup, not a
  money-moving action.
- `POST /api/me/pin/reset` `{ code, newPin }` — the forgot/locked-out-PIN
  recovery path. See Reset below.

`checkTransactionPin(userId, pin?)` is the single source of truth for
this logic (shared by `/api/me/pin` and every transaction route): no
`pinHash` on the account → always passes; account locked → `LOCKED`; no
`pin` submitted or it doesn't match → `INCORRECT` (and increments the
failure counter); `pin` submitted and matches → `ok`, and clears any
prior failure count/lockout.

## Lockout

`checkTransactionPin` tracks `User.pinFailedAttempts` and
`User.pinLockedUntil`. After 5 consecutive wrong PINs, the account locks
for 15 minutes (`MAX_PIN_ATTEMPTS`/`PIN_LOCKOUT_MINUTES` in
`web/src/lib/pin.ts`) — every transfer/purchase route, and `POST
/api/me/pin`'s `currentPin` check, returns `423 PIN_LOCKED` with a
"try again in N minutes" message until the window passes or the PIN is
reset. A correct PIN at any point resets the failure counter to 0.

## Reset ("Forgot PIN?")

`POST /api/me/pin/reset` `{ code, newPin }` bypasses `currentPin`
entirely (and clears any lockout) by requiring a **fresh OTP** for the
signed-in user's own email instead — the same trusted channel already
used for login (`docs/AUTH.md`). Flow: mobile calls the existing `POST
/api/auth/otp/request { email }` to get a code sent, then submits it
here alongside the new PIN; the route verifies it via `checkOtp()`
(`web/src/lib/otp.ts`, the same helper login uses) and consumes it on
success. A user who's locked out or forgotten their PIN always has this
path available since it doesn't depend on knowing the old PIN at all.

## Mobile

- `MeUser.hasPin` (`mobile/lib/src/features/me/me_repository.dart`) —
  parsed straight from `GET /api/me`.
- `promptForTransactionPin()`
  (`mobile/lib/src/core/widgets/pin_prompt.dart`) — a shared modal
  dialog every purchase/transfer screen calls right before submitting,
  **only when `hasPin` is true**. Cancelling aborts the whole
  submission; the entered PIN is passed straight through to the
  repository's `purchase()`/`transfer()` call as an optional `pin` arg.
- `ChangePinScreen`
  (`mobile/lib/src/features/profile/screens/change_pin_screen.dart`) —
  one screen handles both first-time set and change; the "current PIN"
  field, and a "Forgot PIN?" link into `ForgotPinScreen`
  (`forgot_pin_screen.dart`), only appear when `hasPin` is true.
  Reachable from the Profile screen's Account section ("Set transaction
  PIN" / "Change transaction PIN", label and icon both driven by
  `hasPin`). `ForgotPinScreen` drives the two-step reset flow: request a
  code (`AuthRepository.requestOtp`, the same one login uses) → enter
  code + new PIN + confirm → `MeRepository.resetPin()`.
- Profile screen's "Transaction history" entry was removed — it
  duplicated the bottom nav's dedicated History tab
  (`TransactionsScreen`), which already covers the same thing.

## Status

- [x] Optional PIN, enforced server-side on every transfer/purchase
      route once set
- [x] Set/change PIN from Profile, shared PIN-entry dialog reused across
      every purchase/transfer screen
- [x] Lockout after 5 consecutive wrong PINs (15-minute window)
- [x] Email-OTP-gated "Forgot PIN?" reset, reusing the login OTP
      infrastructure — also clears a lockout
- [ ] Not required at signup — a user can transact indefinitely without
      ever setting one; revisit if the business wants it mandatory
