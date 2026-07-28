import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Stores the file on local disk under public/uploads and points
 * User.avatarUrl at it. Fine for local dev, but this filesystem is
 * ephemeral on most serverless hosts (Vercel included) — swap this for
 * real object storage (S3, Cloudinary, etc.) before deploying for real.
 * See docs/PROFILE_MEDIA.md.
 */
export async function POST(request: Request) {
  try {
    const session = requireSession(request);

    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json({ error: "Only PNG, JPEG, or WEBP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${session.userId}-${Date.now()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), bytes);

    const avatarUrl = `/uploads/${filename}`;
    await prisma.user.update({ where: { id: session.userId }, data: { avatarUrl } });

    return NextResponse.json({ avatarUrl });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
