# Wallet & Ledger

## Data model

- `Wallet` — one per user, balance stored as `balanceKobo` (`BigInt`) to
  avoid floating-point drift. `1 naira = 100 kobo`.
- `LedgerEntry` — append-only record of every balance change (`CREDIT` or
  `DEBIT`), each carrying the resulting `balanceAfterKobo`. This is the
  audit trail referenced in the proposal ("every wallet movement is
  tracked and auditable").

All balance mutation goes through `postLedgerEntry` in
`web/src/lib/wallet.ts`, which wraps the wallet update and ledger insert
in a single `prisma.$transaction` — balance and ledger can never drift
apart, and a `DEBIT` that would take the balance negative throws
`InsufficientBalanceError` instead of applying.

## Funding flow (Paystack)

1. Mobile app calls `POST /api/wallet/fund` `{ amountNaira, email }`.
2. Route creates a `PENDING` `Transaction` (`type: WALLET_FUNDING`) and
   calls `initializePaystackTransaction` (`web/src/lib/services/paystack.ts`),
   returning the Paystack checkout URL to open in-app.
3. Paystack calls back `POST /api/wallet/webhook` on `charge.success`.
   The handler verifies the `x-paystack-signature` HMAC before trusting
   the payload, then posts a `CREDIT` ledger entry and marks the
   transaction `SUCCESS`.
4. `GET /api/wallet/balance` returns the current balance for the
   authenticated user.

## Wallet-to-wallet transfer

See [TRANSFER.md](./TRANSFER.md) — `POST /api/wallet/transfer` moves
funds between two users' wallets atomically (not in the original
proposal scope, added to match the mobile home screen design).

## Dedicated virtual account (bank-transfer funding)

`Wallet.virtualAccountNumber` / `virtualAccountBankName` /
`virtualAccountName` exist in the schema and are surfaced by `GET
/api/me` for the mobile home screen's account-number display, but
nothing populates them yet — provisioning a real dedicated virtual
account (e.g. via Paystack) requires business KYB approval that hasn't
happened. Until then these are `null` and the mobile UI falls back to a
"fund your wallet to get started" prompt instead of a fake account
number.

## Status

- [x] Ledger-backed balance with atomic credit/debit
- [x] Paystack initialize + signed webhook
- [x] Wallet-to-wallet transfer (see TRANSFER.md)
- [ ] Second payment gateway (Phase 2, per proposal Section 5)
- [ ] Withdrawal to bank account (Phase 3 — separate KYC/fraud scope)
- [ ] Dedicated virtual account provisioning (fields exist, unpopulated)
