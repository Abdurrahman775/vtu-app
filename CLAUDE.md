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
- `docs/` — one markdown file per Phase 1 feature (`AUTH.md`,
  `WALLET.md`, `AIRTIME.md`, `DATA.md`, `CABLE.md`, `ADMIN.md`), each
  with a design summary and a Status checklist of what's implemented vs.
  still stubbed. Update the relevant doc's Status section whenever you
  finish or start a feature area — that checklist is the source of truth
  for what's real vs. placeholder.

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
```

No test runner is configured yet.

### Mobile (`mobile/`)

The native `android/`/`ios/` folders don't exist yet — this scaffold was
written without the Flutter CLI available. Before first run:

```bash
flutter create --project-name vtu_app --org com.vtuapp .
flutter pub get
```

```bash
flutter run                                                   # run on device/emulator
flutter run --dart-define=API_BASE_URL=http://<host>:3000/api  # point at a non-default backend
flutter analyze                                                # lint
flutter test                                                   # run tests
flutter build apk --release                                    # release APK
```

`API_BASE_URL` defaults to `http://10.0.2.2:3000/api` (Android emulator's
alias for the host machine's `localhost`).

## Architecture

### Backend is Next.js, not a separate server

`web/` plays both roles: Route Handlers under `src/app/api/**` are the
REST API (JSON in/out, `Authorization: Bearer <jwt>`), while pages under
`src/app/admin/**` are server-rendered and read Prisma directly (no HTTP
round-trip needed since they run in the same process). Don't introduce a
separate Express/Nest backend — extend the existing route handlers.

Next.js 16 renamed `middleware.ts` → `proxy.ts` (see `web/proxy.ts`) and
made `params`/`searchParams` always async in Route Handlers/pages — both
matter when adding new routes. `web/AGENTS.md` flags that this Next
version may differ from training data; check
`web/node_modules/next/dist/docs/` before assuming an API shape.

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
