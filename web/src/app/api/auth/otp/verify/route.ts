import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkOtp, OTP_CHECK_MESSAGES } from "@/lib/otp";
import { signSession } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const result = await checkOtp(email, code);
  if (!result.ok) {
    return NextResponse.json(
      { error: OTP_CHECK_MESSAGES[result.reason], reason: result.reason },
      { status: 401 },
    );
  }

  await prisma.otpCode.update({
    where: { id: result.otpId },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { email }, include: { wallet: true } });

  if (!user) {
    user = await prisma.user.create({
      data: { email, wallet: { create: {} } },
      include: { wallet: true },
    });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: "This account has been suspended" }, { status: 403 });
  }

  if (!user.wallet) {
    await prisma.wallet.create({ data: { userId: user.id } });
  }

  const token = signSession({ userId: user.id, role: user.role });

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, phone: user.phone, role: user.role },
  });
}
