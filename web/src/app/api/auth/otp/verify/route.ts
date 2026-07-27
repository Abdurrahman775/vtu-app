import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtpHash } from "@/lib/otp";
import { signSession } from "@/lib/auth";

const bodySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { phone, code } = parsed.data;

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !(await verifyOtpHash(code, otp.codeHash))) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone, wallet: { create: {} } },
    include: { wallet: true },
  });

  if (!user.wallet) {
    await prisma.wallet.create({ data: { userId: user.id } });
  }

  const token = signSession({ userId: user.id, role: user.role });

  return NextResponse.json({ token, user: { id: user.id, phone: user.phone, role: user.role } });
}
