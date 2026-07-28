import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";

const bodySchema = z.object({
  note: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const session = requireSession(request);

    const existingPending = await prisma.verificationRequest.findFirst({
      where: { userId: session.userId, status: "PENDING" },
    });
    if (existingPending) {
      return NextResponse.json({ error: "You already have a pending verification request" }, { status: 409 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const verificationRequest = await prisma.verificationRequest.create({
      data: { userId: session.userId, note: parsed.data.note },
    });

    return NextResponse.json({
      verificationRequest: { id: verificationRequest.id, status: verificationRequest.status },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
