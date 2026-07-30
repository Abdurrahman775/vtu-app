import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

type RouteContext = { params: Promise<{ provider: string }> };

/** Removes a custom logo — the provider falls back to the generated color badge. */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    requireAdmin(request);
    const { provider } = await params;

    await prisma.providerLogo.deleteMany({ where: { provider: provider.toUpperCase() } });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
