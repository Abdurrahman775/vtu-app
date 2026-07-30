import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 2 * 1024 * 1024; // 2MB — these are small icon-sized logos, not photos

/**
 * Stores the file on local disk under public/uploads, same caveat as
 * avatar uploads (`web/src/app/api/me/avatar/route.ts`): fine for local
 * dev, but ephemeral on most serverless hosts — swap for real object
 * storage before deploying for real. See docs/PROVIDER_LOGOS.md.
 */
export async function POST(request: Request) {
  try {
    requireAdmin(request);

    const formData = await request.formData();
    const provider = formData.get("provider");
    const file = formData.get("logo");

    if (typeof provider !== "string" || provider.trim().length === 0) {
      return NextResponse.json({ error: "Provider code is required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WEBP, or SVG images are allowed" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 });
    }

    const providerCode = provider.trim().toUpperCase();

    const uploadDir = path.join(process.cwd(), "public", "uploads", "provider-logos");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${providerCode}-${Date.now()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), bytes);

    const imageUrl = `/uploads/provider-logos/${filename}`;
    const logo = await prisma.providerLogo.upsert({
      where: { provider: providerCode },
      update: { imageUrl },
      create: { provider: providerCode, imageUrl },
    });

    return NextResponse.json({ logo });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
