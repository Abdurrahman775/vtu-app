# Identity Verification

A lightweight "get verified" flow, **not** a real KYC document-upload
pipeline — no ID document capture, no third-party identity check. A user
submits a request (with an optional free-text note), an admin manually
reviews it (presumably by contacting the user out-of-band) and
approves/rejects from `/admin/verification`. Approval flips
`User.isVerified`, which the profile screen displays as a badge.

## Flow

1. `POST /api/verification/request` `{ note? }` — 409s if the user
   already has a `PENDING` request, so they can't spam new ones while
   waiting.
2. Admin reviews at `/admin/verification`; the dashboard overview shows
   a blue alert banner when any request is `PENDING`.
3. `PATCH /api/admin/verification-requests/[id]` `{ decision: "APPROVED" | "REJECTED" }`
   — updates the request and, on approval, sets `User.isVerified = true`
   in the same DB transaction. 409s if the request was already reviewed.
4. `GET /api/me` returns both `isVerified` (the durable badge state) and
   `latestVerificationRequestStatus` (so the mobile UI can show "pending
   review" while waiting, distinct from never having requested at all).

## Status

- [x] Request → admin approve/reject → badge flip, verified end-to-end
      against the real database
- [ ] Rejection has no reason field and doesn't notify the user why
- [ ] No re-request cooldown after a rejection — a rejected user can
      immediately submit again
