# Account Statement

`GET /api/transactions` (`web/src/app/api/transactions/route.ts`) now
accepts optional `from`/`to` ISO-datetime query params:

- Neither provided → unchanged behavior, the 50 most recent
  transactions (used by the Home tab's "Recent Transactions" and the
  plain transaction history list).
- Either provided → **no `take` cap** (a statement should include every
  transaction in range), filtered by `createdAt`.
- `from` more than 3 months before now → `400 { error: "Statements can
  only cover up to 3 months back" }`. This is enforced server-side even
  though the mobile date picker already constrains the range, since the
  API is the actual trust boundary.
- `from` after `to` → `400`.

## Mobile

`StatementScreen`
(`mobile/lib/src/features/statement/screens/statement_screen.dart`),
reachable from the Home tab's "Statement" Quick Service tile:

1. A date-range picker (`showDateRangePicker`) with `firstDate` locked
   to 3 months back (`_earliestAllowedStart()`, mirroring the backend
   cap) and `lastDate` locked to today — the UI can't even construct an
   out-of-range request.
2. "Generate Statement" calls
   `TransactionsRepository.listByRange(from, to)`, then
   `buildStatementPdf()` (`mobile/lib/src/core/pdf/pdf_builder.dart`) to
   render a table (date, type, provider, reference, status, amount) plus
   total-in/total-out summary lines, and hands the bytes to
   `Printing.sharePdf()` — same cross-platform download/share mechanism
   as receipts, see `docs/RECEIPTS.md`.

## Status

- [x] Date-range filtering on `GET /api/transactions`, capped at 3
      months back (enforced both client- and server-side)
- [x] PDF statement generation + share/download
- [ ] No pagination — a statement request has no `take` cap, so a very
      active account over a full 3-month window could return a large
      response; fine at current usage levels, revisit if it becomes a
      problem
