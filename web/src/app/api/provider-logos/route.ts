import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";

/** Read-only for the mobile app — lets ProviderBadge show a real logo when an admin has uploaded one. */
export async function GET(request: Request) {
  try {
    requireSession(request);

    const logos = await prisma.providerLogo.findMany({
      select: { provider: true, imageUrl: true },
    });

    return NextResponse.json({ logos });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
