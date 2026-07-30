# Notifications

In-app only — there is no push (FCM/APNs) integration, no plugin in
`mobile/pubspec.yaml`, and no server keys configured. The mobile app
fetches the current list over HTTP; it does not receive anything while
closed or backgrounded. Adding real push is a separate, larger piece of
work (Firebase project + server credentials + platform config) not done
here.

## Data model

`Notification` (`web/prisma/schema.prisma`): `userId`, `type`
(`TRANSACTION | WALLET | TRANSFER | SYSTEM`), `title`, `body`, optional
`meta` Json, `readAt` (`null` = unread), `createdAt`.

## Routes

- `GET /api/notifications` — the caller's 50 most recent notifications,
  newest first, plus `unreadCount`.
- `POST /api/notifications/[id]/read` — marks one notification read.
  404s if the notification doesn't belong to the caller.
- `POST /api/notifications/read-all` — marks all of the caller's unread
  notifications read.

All three require a session (`requireSession`), same as every other
mobile-facing route.

## What creates a notification

Every flow below calls `createNotification()`
(`web/src/lib/notifications.ts`) **after** its underlying wallet/ledger
operation has already committed, wrapped in try/catch — a notification
write failing must never roll back or fail the request that triggered
it:

- `debitAndPurchase` (`web/src/lib/purchase.ts`) — one notification per
  airtime/data/cable/exam-pin/electricity purchase, on both success and
  failure (including the thrown-error path). Shared across every
  purchase route, so new purchasable services get this for free.
- `POST /api/wallet/webhook` — on a Paystack `charge.success` event,
  notifies the funded user.
- `transferFunds` (`web/src/lib/transfer.ts`) — notifies both the
  sender ("Transfer sent") and the recipient ("Transfer received").
- `POST /api/admin/transactions/[id]/resolve` — notifies the affected
  user when an admin manually resolves a stuck `PENDING` transaction.

## Mobile

`mobile/lib/src/features/notifications/notifications_repository.dart` +
`screens/notifications_screen.dart`, following the same
repository/`FutureProvider.autoDispose`/screen shape as
`transactions_repository.dart`. The bell icon on the Home tab
(`_Header` in `home_tab.dart`) pushes `NotificationsScreen` and shows an
unread-count `Badge`; tapping an unread row marks it read and refreshes
the list. There's no background polling — the badge only updates on
Home-tab rebuild (pull-to-refresh, or returning from the notifications
screen).

## Status

- [x] Notification model, list/mark-read/mark-all-read routes
- [x] Auto-created on purchases, wallet funding, transfers, admin
      manual resolution
- [x] Mobile notification center + unread badge on the bell icon
- [ ] Push notifications (FCM) — needs a Firebase project + server
      credentials, not set up
- [ ] Notifications for admin-initiated events other than manual
      transaction resolution (e.g. verification approval/rejection)
