# Profile Picture Upload

`POST /api/me/avatar` — multipart form upload (`avatar` field), PNG/JPEG/WEBP
only, 5MB max. Writes to `web/public/uploads/` and sets `User.avatarUrl` to
the resulting `/uploads/<filename>` path, which Next.js serves as a static
file automatically (anything under `public/` is served at the root).

## This will break on real deployment

Local disk storage only works because this runs on one long-lived dev
machine. Most serverless hosts (**Vercel included**) have an ephemeral or
read-only filesystem at runtime — an uploaded file can vanish on the next
cold start or simply fail to write at all. Before deploying for real,
swap `web/src/app/api/me/avatar/route.ts` for a real object storage
upload (S3, Cloudinary, Supabase Storage, etc.) and store the resulting
CDN URL in `avatarUrl` instead of a local path.

## Status

- [x] Upload, validation (type/size), static serving — verified
      end-to-end against the real filesystem and a running server
- [ ] Not yet wired into the mobile Profile screen (see
      `docs/VERIFICATION.md` for the combined mobile UI work)
- [ ] No deletion of old avatars when a new one is uploaded — orphaned
      files accumulate in `public/uploads/`
