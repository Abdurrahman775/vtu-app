import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";

export async function POST(request: Request) {
  try {
    const session = requireSession(request);

    await prisma.notification.updateMany({
      where: { userId: session.userId, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
