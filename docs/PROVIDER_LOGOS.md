# Provider Logos

The app ships with **no licensed brand artwork** — MTN, Airtel, DSTV,
GOtv, StarTimes, WAEC, NECO, and every electricity disco render as a
generated color badge (`mobile/lib/src/core/widgets/provider_badge.dart`'s
`providerBrands` map: real-ish brand color + short label, e.g. yellow
circle "MTN") instead of an actual logo image. This is deliberate — an
LLM-authored codebase can't legally source and embed trademarked logo
files, and this app could go commercial per the proposal doc.

This feature lets an **admin** upload a real logo for any provider,
which then overrides the color badge everywhere that provider appears
in the mobile app (purchase screens' dropdowns, transaction list,
transaction detail). Whoever uploads is responsible for having the
rights to use the image (official press kit, licensing agreement,
etc.) — this app does not source or validate that.

## Data model

`ProviderLogo` (`web/prisma/schema.prisma`): `provider` (free-text code,
uppercased, e.g. `"MTN"`, `"DSTV"`, `"IKEDC"` — matches whatever the
mobile app already uses in `providerBrands`, not a foreign key to
anything), `imageUrl`, `updatedAt`. No row for a provider = falls back
to the color badge.

## Routes

- `POST /api/admin/provider-logos` (admin, multipart `{ provider,
  logo }`) — uploads/replaces the logo for a provider code. Same
  local-disk-under-`public/uploads` storage as avatar uploads
  (`web/src/app/api/me/avatar/route.ts`) and the same caveat: fine for
  local dev, ephemeral on most serverless hosts, swap for real object
  storage before a real deployment. 2MB cap, PNG/JPEG/WEBP/SVG only.
- `DELETE /api/admin/provider-logos/[provider]` (admin) — removes the
  custom logo, reverting that provider to its color badge.
- `GET /api/provider-logos` (any authenticated user) — the full list,
  used by the mobile app to resolve real logo URLs.

## Admin dashboard

`/admin/provider-logos` — upload form (pick a known provider code or
type a new one, choose a file) plus a table of everything currently
uploaded with a "Remove" action per row.

## Mobile

`ProviderBadge` (`mobile/lib/src/core/widgets/provider_badge.dart`) is
now a `ConsumerWidget`: it watches `providerLogosProvider`
(`mobile/lib/src/features/provider_logos/provider_logos_repository.dart`)
and renders the real image (`Image.network`, falling back to the color
badge on load failure) if one exists for that code, otherwise the color
badge. Every call site (airtime/data/cable/electricity/exam-pin
dropdowns, transaction list, transaction detail) gets this for free —
no per-screen changes needed when an admin uploads a new logo.

## Status

- [x] Admin upload/remove + public list routes
- [x] Admin dashboard page
- [x] Mobile `ProviderBadge` prefers a real uploaded logo over the color
      badge, with a graceful fallback on load failure
- [ ] Local-disk storage, same production caveat as `docs/PROFILE_MEDIA.md`
- [ ] No image resizing/optimization — an admin uploading a huge image
      will serve it at full size scaled down client-side
