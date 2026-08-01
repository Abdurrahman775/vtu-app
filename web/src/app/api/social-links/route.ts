import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";

/** Read-only for the mobile app — Profile's "Follow us" section only shows platforms an admin has set. */
export async function GET(request: Request) {
  try {
    requireSession(request);

    const links = await prisma.socialLink.findMany({
      select: { platform: true, url: true },
    });

    return NextResponse.json({ links });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
