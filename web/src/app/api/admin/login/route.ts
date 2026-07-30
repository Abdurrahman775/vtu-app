import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkOtp, OTP_CHECK_MESSAGES } from "@/lib/otp";
import { signSession } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
});

/**
 * Admin accounts reuse the email+OTP flow but require role=ADMIN
 * (set manually in the DB — there is no self-service admin signup).
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not an admin account" }, { status: 403 });
  }

  const result = await checkOtp(email, code);
  if (!result.ok) {
    return NextResponse.json(
      { error: OTP_CHECK_MESSAGES[result.reason], reason: result.reason },
      { status: 401 },
    );
  }

  await prisma.otpCode.update({ where: { id: result.otpId }, data: { consumedAt: new Date() } });

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
