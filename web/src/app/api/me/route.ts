import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toNaira } from "@/lib/wallet";

export async function GET(request: Request) {
  try {
    const session = requireSession(request);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: { wallet: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
      wallet: user.wallet && {
        balanceNaira: toNaira(user.wallet.balanceKobo),
        currency: user.wallet.currency,
        virtualAccountNumber: user.wallet.virtualAccountNumber,
        virtualAccountBankName: user.wallet.virtualAccountBankName,
        virtualAccountName: user.wallet.virtualAccountName,
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}

const patchBodySchema = z.object({
  fullName: z.string().trim().min(1).max(100),
});

export async function PATCH(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = patchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { fullName: parsed.data.fullName },
    });

    return NextResponse.json({ user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
