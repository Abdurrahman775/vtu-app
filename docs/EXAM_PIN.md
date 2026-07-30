# WAEC / NECO Exam Pin

`POST /api/exam-pin/purchase` `{ examBody, quantity, amountNaira }` for
`WAEC | NECO`. Same `priceWithMargin` + `debitAndPurchase` flow as
[AIRTIME.md](./AIRTIME.md), [DATA.md](./DATA.md), and
[CABLE.md](./CABLE.md) — `amountNaira` is the base cost for `quantity`
pins; margin for `(EXAM_PIN, examBody)` is added on top before debiting
the customer. `quantity` is stored in `Transaction.meta`, same as cable's
`smartCardNumber`/`planCode`.

The mobile app ships a hardcoded per-pin price
(`mobile/lib/src/features/exam_pin/exam_pin_repository.dart`,
`examPinPricesByBody`) until the real provider and live pricing are
wired up — same placeholder-catalogue approach as cable.

## Status

- [x] Route + debit/refund flow (shared with airtime/data/cable)
- [ ] Replace hardcoded per-pin price with live provider data
- [ ] Real VTU provider wired up (see `AIRTIME.md`)
