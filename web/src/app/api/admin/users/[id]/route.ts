import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

const bodySchema = z.object({
  isActive: z.boolean(),
});

type RouteContext = { params: Promise<{ id: string }> };

/** Lets an admin suspend/reinstate a user's account. */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
    });

    return NextResponse.json({ user: { id: user.id, isActive: user.isActive } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
