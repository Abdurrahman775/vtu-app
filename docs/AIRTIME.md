# Airtime Purchase

`POST /api/airtime/purchase` `{ network, phone, amountNaira }` for
`MTN | AIRTEL | GLO | 9MOBILE`.

Uses the shared `debitAndPurchase` helper (`web/src/lib/purchase.ts`):

1. Create a `PENDING` `Transaction` (`type: AIRTIME`).
2. Debit the wallet via `postLedgerEntry` (throws `InsufficientBalanceError`
   → `402` if the balance can't cover it — debit happens **before** the
   provider call so the wallet can't be double-spent by concurrent requests).
3. Call `purchaseAirtime` (`web/src/lib/services/vtuProvider.ts`).
4. On success mark the transaction `SUCCESS`; on failure (or a thrown
   error) mark it `FAILED` and post a compensating `CREDIT` ledger entry
   to refund the debit automatically.

## Status

- [x] Route + debit/refund flow
- [ ] Real VTU provider wired up — `vtuProvider.ts` calls a
      `VTU_PROVIDER_BASE_URL` that doesn't exist yet; provider choice is
      one of the client's Section 7 decisions in the proposal
- [ ] Push notification on completion (proposal Phase 1 feature)
