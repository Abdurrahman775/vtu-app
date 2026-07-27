# Wallet-to-Wallet Transfer

Not in the original Phase 1 proposal scope, added to match the mobile
home screen mockup's "Transfer" quick action.

`POST /api/wallet/transfer` `{ toPhone, amountNaira }` — sends money from
the authenticated user's wallet to another app user identified by phone
number.

Unlike the purchase flows (`docs/AIRTIME.md` etc.), this does **not**
reuse `postLedgerEntry`/`debitAndPurchase`, because those touch one
wallet at a time. A transfer must debit one wallet and credit another
atomically, so `transferFunds` (`web/src/lib/transfer.ts`) does both
balance updates and both `LedgerEntry`/`Transaction` writes inside a
single `prisma.$transaction` — if either side fails, the whole transfer
rolls back.

Each transfer produces **two** `Transaction` rows (type `TRANSFER`),
one per user, sharing a reference prefix (`..._out` / `..._in`) so both
sides show up correctly in each user's own transaction history.

## Status

- [x] Atomic debit+credit across two wallets
- [x] Rejects self-transfer and unknown recipient phone numbers
- [x] Test coverage (`web/tests/transfer.test.ts`) — atomic move, both
      sides' `Transaction` rows, self-transfer/unknown-recipient
      rejection, and overdraw leaving both wallets untouched, all against
      a real database
- [ ] No transfer limits/fraud checks yet — fine for Phase 1 testing, but
      revisit before handling real money at scale
