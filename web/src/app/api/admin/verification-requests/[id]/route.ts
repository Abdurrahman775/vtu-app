import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

const bodySchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const verificationRequest = await prisma.verificationRequest.findUniqueOrThrow({ where: { id } });
    if (verificationRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already reviewed" }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.verificationRequest.update({
        where: { id },
        data: { status: parsed.data.decision, reviewedAt: new Date() },
      });
      await tx.user.update({
        where: { id: verificationRequest.userId },
        data: { isVerified: parsed.data.decision === "APPROVED" },
      });
      return req;
    });

    return NextResponse.json({ verificationRequest: { id: updated.id, status: updated.status } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
