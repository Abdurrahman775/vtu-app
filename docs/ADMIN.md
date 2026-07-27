# Admin Dashboard

Server-rendered pages under `web/src/app/admin/*`, protected by
`web/proxy.ts` (redirects to `/admin/login` unless the `admin_session`
cookie holds a valid `ADMIN`-role JWT). See [AUTH.md](./AUTH.md) for how
admin login works. Styled with Tailwind (installed by `create-next-app
--tailwind`); `web/src/app/admin/layout.tsx` hides the sidebar nav on
`/admin/login` via `usePathname`, since that page isn't part of the
authenticated shell.

## Pages

- `/admin/transactions` — all transactions across all users, newest
  first, with "Mark success" / "Mark failed" actions on `PENDING` rows
  (`POST /api/admin/transactions/[id]/resolve`). Marking a wallet-funding
  transaction `SUCCESS` posts the missing `CREDIT` ledger entry; marking
  a purchase `FAILED` posts a compensating refund — mirrors the
  auto-refund logic in `debitAndPurchase` for cases where a provider
  callback never arrives and an admin has to intervene manually.
- `/admin/users` — user list with phone, role, and current wallet
  balance.
- `/admin/pricing` — `PricingRule` margin-percent per (service, provider)
  pair, via `PUT /api/admin/pricing`. Not yet consumed by the purchase
  routes (see Status).

## Status

- [x] Auth-gated dashboard shell (transactions, users, pricing)
- [x] Manual transaction resolution with correct ledger side-effects
- [x] Purchase routes apply `PricingRule.marginPercent` — see
      `web/src/lib/pricing.ts` and `docs/AIRTIME.md`
- [ ] Dispute-resolution workflow, analytics (Phase 2, per proposal
      Section 5)
