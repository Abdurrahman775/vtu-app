# Profile

The mobile Profile tab, restructured into distinct sections rather than
one long scrolling list: **Account**, **Personal**, **Payment Method**,
**Settings**, **Verification Status**, and an optional **Follow us**
section (see `docs/SOCIAL_LINKS.md`). Modeled on a common fintech-app
Profile layout, adapted to what this app's data model actually
supports — no multi-email/phone, address, or business-account upgrade,
since those would need new backend features this repo doesn't have.

## Sections

- **Account** (`account_screen.dart`) — read-only summary: email,
  phone, wallet balance, virtual account details. Everything here
  already comes from `GET /api/me`; this screen doesn't add any new
  data, just a dedicated place to see it.
- **Personal** (`personal_screen.dart`) — email (read-only, it's the
  login identifier) and phone (add/change/remove via `PATCH /api/me {
  phone }`, which now accepts a string to set, `null` to remove, or
  omitting it to leave it untouched). 409s if the new phone is already
  used by another account.
- **Payment Method** — inline row on the main Profile screen showing
  the wallet's virtual account (was previously labeled "Linked bank
  account"); no separate screen since there's nothing else to show yet.
- **Settings** (`settings_screen.dart`) — see below.
- **Verification Status** — same underlying data as before
  (`docs/VERIFICATION.md`), now shown as a standalone label+status row
  instead of a card entry, matching the reference design.

## Settings screen

- **Hide Balance** — real, persisted toggle (`balanceHiddenProvider`,
  `mobile/lib/src/core/wallet_visibility_provider.dart`, backed by
  `shared_preferences`). The Home tab's wallet-card eye icon and this
  Settings toggle both read/write the same persisted state, so they
  can't drift out of sync, and the hidden/shown state now survives app
  restarts (previously it was local `State`, reset every time).
- **Transaction PIN** — real, links to the existing `ChangePinScreen`
  (`docs/TRANSACTION_PIN.md`), moved here from the main Profile list.
- **Dark Mode** — real, but simplified: previously a 3-way System/
  Light/Dark `SegmentedButton`, now a single Switch (light vs. dark
  only, matching the reference design). Still backed by the same
  `themeModeProvider` (`docs/DARK_MODE.md`) — an account that's never
  touched the switch still follows system brightness (`ThemeMode.system`
  is still the initial state, just no longer has a dedicated UI control
  to pick it explicitly).
- **Manage Devices**, **Enable Security Lock**, **Enable Face ID**,
  **Rate the App** — intentionally **not implemented**. These are shown
  as placeholders (a disabled-looking switch/row that shows a "coming
  soon" message on tap, same convention as the existing Terms & Privacy
  Policy placeholder) purely to match the reference design's layout —
  there is no app-lock, device-management, or biometric-auth feature
  behind them.

## Status

- [x] Profile restructured into Account/Personal/Payment
      Method/Settings/Verification Status
- [x] Phone number editable (add/change/remove) from Personal
- [x] Hide Balance is a real, persisted setting
- [x] Dark Mode simplified to a light/dark toggle
- [ ] Manage Devices / Security Lock / Face ID / Rate the App are
      visual placeholders only — build for real if the business wants
      app-lock or biometric auth
