# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VTU (Virtual Top-Up) reselling app for the Nigerian market — users fund a
wallet and buy airtime, data bundles, and cable TV subscriptions. See
`VTU App Proposal.docx` for the full commercial scope (Phase 1 = this
repo; Phase 2 = electricity/exam pins/referrals; Phase 3 = withdrawal to
bank account — both future, separately-scoped engagements, not built here).

This is a monorepo with two apps sharing one backend contract:

- `web/` — Next.js 16 app. Serves **both** the admin dashboard (server
  components under `src/app/admin/*`) **and** the JSON API
  (`src/app/api/**/route.ts`) that the mobile app calls. There is no
  separate backend service.
- `mobile/` — Flutter app (Dart), the end-user client. Calls the same
  `web/` API over HTTP.
- `docs/` — one markdown file per feature (`AUTH.md`, `WALLET.md`,
  `AIRTIME.md`, `DATA.md`, `CABLE.md`, `TRANSFER.md`, `ADMIN.md`), each
  with a design summary and a Status checklist of what's implemented vs.
  still stubbed. Update the relevant doc's Status section whenever you
  finish or start a feature area — that checklist is the source of truth
  for what's real vs. placeholder.

The mobile Home screen follows a specific UI mockup (a wallet-balance
card + Quick Services grid + Recent Transactions list); `GET /api/me`
exists specifically to feed that screen's greeting/balance header in one
call, and `PATCH /api/me` (`{ fullName }`) lets a user set their display
name from the Profile screen (`mobile/lib/src/features/profile/screens/profile_screen.dart`).
Don't restyle the Home tab without checking it against the original
design intent first.

## Commands

### Web (`web/`)

```bash
npm run dev            # start dev server (Turbopack, default in Next 16)
npm run build           # production build
npm run lint            # eslint
npx tsc --noEmit         # typecheck
npx prisma generate      # regenerate Prisma client after schema.prisma changes
npx prisma migrate dev   # create + apply a migration (needs DATABASE_URL)
npx prisma studio        # browse the DB
npm run test             # vitest — needs a running Postgres + web/.env.test (see below)
```

### Tests

Integration tests run against a **real** Postgres database (`vtu_app_test`,
separate from the dev DB), not mocks — `tests/helpers.ts`'s `resetDb()`
truncates all tables in `beforeEach`. One-time setup:

```bash
sudo -u postgres psql -c "CREATE DATABASE vtu_app_test OWNER vtu_app;"
cp web/.env.test.example web/.env.test   # adjust if your DB user/password differ
cd web && npx dotenv -e .env.test -- npx prisma migrate deploy
```

`vitest.config.ts` sets `fileParallelism: false` — every test file shares
the one live DB and truncates it in `beforeEach`, so files must run
serially or they clobber each other's fixtures mid-test. Don't remove
that setting without giving each file (or each test) its own isolated
data instead. `tests/setup.ts` refuses to run at all unless
`DATABASE_URL` contains `vtu_app_test`, as a guard against accidentally
truncating the dev database.

### Mobile (`mobile/`)

Flutter SDK lives at `~/flutter` (add `~/flutter/bin` to `PATH`). Only
the **web** platform is scaffolded (`flutter create --platforms=web`) —
no `android/`/`ios/` folders exist yet; add them the same way
(`flutter create --platforms=android,ios .`) if/when a real device build
is needed. `flutter create` never touches `lib/`, `pubspec.yaml`, or
`analysis_options.yaml` in an existing project, so it's safe to re-run.

```bash
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api
flutter analyze
flutter test
```

`API_BASE_URL` defaults to `http://10.0.2.2:3000/api` (the Android
emulator's alias for the host machine's `localhost`) — **override it for
Chrome/web**, which needs the real `localhost:3000`. The backend's
`src/proxy.ts` sends permissive CORS headers on `/api/**` specifically so
a browser-hosted Flutter build (a different origin/port than the
backend) can call it; a native mobile build doesn't need this since it
has no browser origin to restrict.

## Architecture

### Backend is Next.js, not a separate server

`web/` plays both roles: Route Handlers under `src/app/api/**` are the
REST API (JSON in/out, `Authorization: Bearer <jwt>`), while pages under
`src/app/admin/**` are server-rendered and read Prisma directly (no HTTP
round-trip needed since they run in the same process). Don't introduce a
separate Express/Nest backend — extend the existing route handlers.

Next.js 16 renamed `middleware.ts` → `proxy.ts` and made
`params`/`searchParams` always async in Route Handlers/pages — both
matter when adding new routes. `web/AGENTS.md` flags that this Next
version may differ from training data; check
`web/node_modules/next/dist/docs/` before assuming an API shape.

**`proxy.ts` must live at `web/src/proxy.ts`, not `web/proxy.ts`** —
because this project uses a `src/` layout, Next.js only discovers proxy
at the same level as `app/`. It was originally placed at the project
root and silently never ran: the admin dashboard's auth redirect and the
API's CORS headers both looked correct in code but did nothing until the
file was moved. There's no build-time or type-time signal for this
mistake — verify with `curl -i` (check for `access-control-*` response
headers, or that `/admin/transactions` 307-redirects to `/admin/login`
when unauthenticated) after touching `proxy.ts`, don't just trust that
it typechecks.

### Auth: phone + OTP only, two token delivery mechanisms

No passwords in Phase 1. `POST /api/auth/otp/request` → `POST
/api/auth/otp/verify` issues a JWT (`web/src/lib/auth.ts`). The mobile
app carries it as a Bearer header; the admin dashboard instead gets it as
an httpOnly `admin_session` cookie (set by `POST /api/admin/login`, which
requires `User.role === "ADMIN"`). `requireSession`/`requireAdmin`
(`web/src/lib/requireSession.ts`) accept either transport, so route
handlers don't need to care which client is calling. See `docs/AUTH.md`.

### Wallet: ledger-first, kobo-denominated

Every balance change is a `LedgerEntry` (`CREDIT`/`DEBIT`) written in the
same DB transaction as the `Wallet.balanceKobo` update
(`postLedgerEntry` in `web/src/lib/wallet.ts`) — balance and ledger
cannot drift apart, and this is the audit trail the proposal requires
("every wallet movement is tracked and auditable"). Amounts are always
`BigInt` kobo internally; convert with `toKobo`/`toNaira`, never do float
arithmetic on money. See `docs/WALLET.md`.

### Purchases: debit-first with automatic refund on failure

Airtime/data/cable all go through the shared `debitAndPurchase`
(`web/src/lib/purchase.ts`): create a `PENDING` `Transaction` → debit the
wallet → call the upstream VTU provider → mark `SUCCESS`/`FAILED`, posting
a compensating `CREDIT` refund on any failure or thrown error. When
adding a new purchasable service, reuse this helper rather than
reimplementing the debit/refund dance. See `docs/AIRTIME.md`,
`docs/DATA.md`, `docs/CABLE.md`.

`web/src/lib/services/vtuProvider.ts` is a stub — the actual VTU reseller
API (VTpass, Baxi, etc.) is a client decision not yet made, so purchases
will fail against real traffic until `VTU_PROVIDER_BASE_URL`/`_API_KEY`
point at a real provider.

### Wallet-to-wallet transfer is a different code path than purchases

`web/src/lib/transfer.ts`'s `transferFunds` debits one wallet and
credits another inside a single `prisma.$transaction` — it does not
reuse `postLedgerEntry`/`debitAndPurchase` (which only touch one wallet
at a time). See `docs/TRANSFER.md`.

### Dark mode uses a class variant, not the Tailwind default

`web/src/app/globals.css` overrides Tailwind's default
`prefers-color-scheme` dark variant with a class-based one
(`@custom-variant dark (&:where(.dark, .dark *));`) so the manual toggle
in `ThemeToggle.tsx` can override the system preference — the default
media-query variant can't be overridden by JS at all. See
`docs/DARK_MODE.md`, and note the warning comment in `globals.css`: this
broke twice before from implicit color inheritance (elements missing an
explicit `dark:` class going invisible), so there's no shortcut when
adding new dashboard components — every one needs its own explicit
light/dark color classes.

### Data model

Single Prisma schema (`web/prisma/schema.prisma`) shared by both the API
and the admin dashboard: `User` → `Wallet` → `LedgerEntry`, plus
`Transaction` (one per funding/airtime/data/cable event, linked 1:1 to
the `LedgerEntry` it produced) and `PricingRule` (admin-configurable
margin per service+provider — defined but not yet applied when pricing a
sale, see `docs/ADMIN.md`). Prisma is pinned to v6 deliberately — v7
requires driver adapters and a separate `prisma.config.ts`; don't upgrade
without redoing the datasource wiring across `web/src/lib/prisma.ts` and
`web/prisma/schema.prisma`.
