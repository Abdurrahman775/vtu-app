import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

type RouteContext = { params: Promise<{ platform: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    requireAdmin(request);
    const { platform } = await params;

    await prisma.socialLink.deleteMany({ where: { platform: platform.toUpperCase() } });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
