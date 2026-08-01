import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

const bodySchema = z.object({
  platform: z.string().trim().min(1).max(30),
  url: z.string().trim().url(),
});

export async function PUT(request: Request) {
  try {
    requireAdmin(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const platform = parsed.data.platform.toUpperCase();

    const link = await prisma.socialLink.upsert({
      where: { platform },
      update: { url: parsed.data.url },
      create: { platform, url: parsed.data.url },
    });

    return NextResponse.json({ link });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
