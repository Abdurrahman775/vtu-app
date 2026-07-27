# Cable TV Subscription

`POST /api/cable/purchase` `{ provider, smartCardNumber, planCode, amountNaira }`
for `DSTV | GOTV | STARTIMES`. Same `priceWithMargin` + `debitAndPurchase`
flow as [AIRTIME.md](./AIRTIME.md) and [DATA.md](./DATA.md) —
`amountNaira` is the plan's base cost; margin for `(CABLE_TV, provider)`
is added on top before debiting the customer.

Like data plans, the mobile app ships a hardcoded placeholder plan
catalogue (`mobile/lib/src/features/cable_tv/cable_repository.dart`,
`cablePlansByProvider`) until the real provider and live pricing are
wired up.

## Status

- [x] Route + debit/refund flow (shared with airtime/data)
- [ ] Replace hardcoded plan catalogue with live provider data
- [ ] Real VTU provider wired up (see `AIRTIME.md`)
