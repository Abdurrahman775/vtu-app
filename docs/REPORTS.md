# Transaction Reports

Lets a user flag a problem with one of their own transactions (e.g.
"airtime never arrived") for an admin to review — separate from the
existing admin-side manual resolve flow (`docs/AIRTIME.md`), which is
for admins fixing a stuck `PENDING` transaction; this is for a user
complaining about one that already looks `SUCCESS`/`FAILED`.

## Flow

1. `GET /api/transactions/[id]` — transaction detail (404 if it doesn't
   belong to the requesting user), includes `meta` (phone/planCode/etc.)
   for the mobile receipt view.
2. `POST /api/transactions/[id]/report` `{ reason, message? }` — 404s
   the same way if the transaction isn't the caller's own. Creates a
   `TransactionReport` row (`status: OPEN`).
3. Admin dashboard `/admin/reports` lists all reports (open and
   resolved), with a "Mark resolved" action
   (`PATCH /api/admin/reports/[id]`). The dashboard overview page
   surfaces a red alert banner when any report is `OPEN`.

## Status

- [x] User-facing report creation, admin list + resolve
- [x] Verified end-to-end against the real database (detail fetch →
      report submit → shows on `/admin/reports` → resolve → status
      updates)
- [ ] No notification to the user when their report is resolved
- [ ] No admin-side reply/note field — resolving is binary, no way to
      record *why* or communicate back to the user yet
