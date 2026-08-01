# Social Links

Admin-configurable "follow us" links shown on the mobile Profile
screen — same pattern as `docs/PROVIDER_LOGOS.md`'s logo uploads: a
platform is only visible on the Profile screen once an admin sets a
link for it, and disappears again if removed.

## Data model

`SocialLink` (`web/prisma/schema.prisma`): `platform` (free-text,
uppercased — e.g. `"INSTAGRAM"`, `"YOUTUBE"`, `"X"`, `"FACEBOOK"`,
`"TIKTOK"`, `"WHATSAPP"`, or any custom code an admin types in), `url`,
`updatedAt`.

## Routes

- `PUT /api/admin/social-links` (admin) `{ platform, url }` — upserts a
  link by platform.
- `DELETE /api/admin/social-links/[platform]` (admin) — removes it.
- `GET /api/social-links` (any authenticated user) — the full list, used
  by the mobile app.

## Admin dashboard

`/admin/social-links` — a form to set/replace a link (pick a known
platform or type a custom one) plus a table of everything currently set
with a "Remove" action.

## Mobile

Profile screen's "Follow us" section (`profile_screen.dart`) watches
`socialLinksProvider`
(`mobile/lib/src/features/social_links/social_links_repository.dart`)
and renders one row per link, generic Material icons standing in for
real brand logos (same reasoning as `docs/PROVIDER_LOGOS.md` — no
licensed brand artwork ships with this app). The whole section is
omitted from the layout entirely when the list is empty, not shown as
an empty state.

## Status

- [x] Admin CRUD + public list route
- [x] Mobile "Follow us" section, hidden when nothing's configured
