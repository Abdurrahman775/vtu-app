import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtpHash } from "@/lib/otp";
import { signSession } from "@/lib/auth";

const bodySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

/**
 * Admin accounts reuse the phone+OTP flow but require role=ADMIN
 * (set manually in the DB — there is no self-service admin signup).
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { phone, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not an admin account" }, { status: 403 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !(await verifyOtpHash(code, otp.codeHash))) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const token = signSession({ userId: user.id, role: user.role });

  const response = NextResponse.json({ message: "Logged in" });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
