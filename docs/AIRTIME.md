# Airtime Purchase

`POST /api/airtime/purchase` `{ network, phone, amountNaira }` for
`MTN | AIRTEL | GLO | 9MOBILE`. `amountNaira` is the **base/face value**
of the airtime — what the customer actually receives, and what the VTU
provider charges the reseller.

1. `priceWithMargin` (`web/src/lib/pricing.ts`) looks up the admin's
   `PricingRule` for `(AIRTIME, network)` and marks the base amount up
   by `marginPercent` — that marked-up amount is what actually gets
   debited from the customer's wallet. No matching rule = 0% margin
   (customer charged exactly the base amount).
2. Uses the shared `debitAndPurchase` helper (`web/src/lib/purchase.ts`):
   - Create a `PENDING` `Transaction` (`type: AIRTIME`) with the
     **marked-up** `amountKobo`; `meta` records `baseAmountNaira` and
     `marginPercent` for audit purposes.
   - Debit the wallet via `postLedgerEntry` for the marked-up amount
     (throws `InsufficientBalanceError` → `402` if the balance can't
     cover it — debit happens **before** the provider call so the
     wallet can't be double-spent by concurrent requests).
   - Call `purchaseAirtime` (`web/src/lib/services/vtuProvider.ts`) with
     the original **base** `amountNaira` — the provider only ever sees
     the cost price, never the marked-up charge.
   - On success mark the transaction `SUCCESS`; on failure (or a thrown
     error) mark it `FAILED` and post a compensating `CREDIT` ledger
     entry to refund the full marked-up debit automatically.

## Status

- [x] Route + debit/refund flow
- [ ] Real VTU provider wired up — `vtuProvider.ts` calls a
      `VTU_PROVIDER_BASE_URL` that doesn't exist yet; provider choice is
      one of the client's Section 7 decisions in the proposal
- [ ] Push notification on completion (proposal Phase 1 feature)
