# Data Bundle Purchase

`POST /api/data/purchase` `{ network, phone, planCode, amountNaira }` for
`MTN | AIRTEL | GLO | 9MOBILE`. Follows the exact same
debit-then-call-provider-then-settle flow as [AIRTIME.md](./AIRTIME.md)
via `debitAndPurchase`.

`planCode` identifies the specific bundle (e.g. "1GB - 30 days") on the
upstream VTU provider. The mobile app currently ships a **hardcoded
placeholder catalogue** (`mobile/lib/src/features/data_bundle/data_repository.dart`,
`dataPlansByNetwork`) since the real provider and its live plan list
aren't chosen yet.

## Status

- [x] Route + debit/refund flow (shared with airtime/cable)
- [ ] Replace hardcoded plan catalogue with a live `GET` from the chosen
      VTU provider (or a `DataPlan` DB table if prices need to be
      admin-editable)
- [ ] Real VTU provider wired up (see `AIRTIME.md`)
