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
      include: {
        wallet: true,
        verificationRequests: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        latestVerificationRequestStatus: user.verificationRequests[0]?.status ?? null,
        hasPin: user.pinHash !== null,
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

const patchBodySchema = z
  .object({
    fullName: z.string().trim().min(1).max(100).optional(),
    /// A string sets/changes the phone; `null` removes it; omitted leaves it untouched.
    phone: z.string().trim().min(10).max(15).nullable().optional(),
  })
  .refine((body) => body.fullName !== undefined || body.phone !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = patchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { fullName, phone } = parsed.data;

    if (phone) {
      const phoneTaken = await prisma.user.findUnique({ where: { phone } });
      if (phoneTaken && phoneTaken.id !== session.userId) {
        return NextResponse.json({ error: "Phone number is already in use" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
      },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, phone: user.phone, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
