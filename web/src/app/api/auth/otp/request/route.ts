import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkOtpRateLimit, generateOtpCode, hashOtp, otpExpiryDate, sendOtpEmail } from "@/lib/otp";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  const { email } = parsed.data;

  if (!(await checkOtpRateLimit(email))) {
    return NextResponse.json(
      { error: "Too many codes requested. Please try again later." },
      { status: 429 },
    );
  }

  const code = generateOtpCode();
  const codeHash = await hashOtp(code);

  await prisma.otpCode.create({
    data: { email, codeHash, expiresAt: otpExpiryDate() },
  });

  await sendOtpEmail(email, code);

  return NextResponse.json({ message: "OTP sent" });
}
