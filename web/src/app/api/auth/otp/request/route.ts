import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashOtp, otpExpiryDate, sendOtpSms } from "@/lib/otp";

const bodySchema = z.object({
  phone: z.string().min(10).max(15),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  const { phone } = parsed.data;

  const code = generateOtpCode();
  const codeHash = await hashOtp(code);

  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt: otpExpiryDate() },
  });

  await sendOtpSms(phone, code);

  return NextResponse.json({ message: "OTP sent" });
}
