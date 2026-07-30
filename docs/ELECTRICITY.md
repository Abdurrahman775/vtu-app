# Electricity (Prepaid/Postpaid)

Two endpoints, both requiring a session:

- `POST /api/electricity/verify-meter` `{ disco, meterNumber, meterType }`
  — looks up the customer name/address for a meter before the user
  commits to a purchase. Calls `verifyMeter()` in
  `web/src/lib/services/vtuProvider.ts` (a stub — see below) and returns
  `{ customerName, address }`, or a 502 if the provider call fails/isn't
  configured. Does not touch the wallet.
- `POST /api/electricity/purchase` `{ disco, meterNumber, meterType,
  amountNaira }` — same `priceWithMargin` + `debitAndPurchase` flow as
  [CABLE.md](./CABLE.md)/[EXAM_PIN.md](./EXAM_PIN.md). `meterNumber` and
  `meterType` are stored in `Transaction.meta`.

`disco` is one of the values in `web/src/lib/electricity.ts`'s `DISCOS`
list (`IKEDC`, `EKEDC`, `AEDC`, `PHED`, `IBEDC`, `EEDC`, `KEDCO`, `JED`,
`KAEDCO`, `BEDC`) — shared between both routes so they can't drift out
of sync.

The mobile app calls verify-meter before showing the amount/purchase
step (`mobile/lib/src/features/electricity/screens/electricity_screen.dart`),
so the user sees "Meter verified: <name>" before paying — mirrors how
real disco APIs work, but `verifyMeter()`'s response is currently a stub
(no real disco integration yet).

## Status

- [x] Verify-meter route + purchase route (shared debit/refund flow)
- [ ] Real VTU/disco provider wired up for both verify and purchase (see `AIRTIME.md`)
