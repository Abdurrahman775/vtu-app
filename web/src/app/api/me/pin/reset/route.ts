import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { checkOtp, OTP_CHECK_MESSAGES } from "@/lib/otp";
import { hashPin, isValidPinFormat } from "@/lib/pin";

const bodySchema = z.object({
  code: z.string().length(6),
  newPin: z.string(),
});

/**
 * Recovery path for a forgotten (or locked-out) transaction PIN — since
 * `POST /api/me/pin` needs the *current* PIN, which is exactly what's
 * missing here. Reuses the same email+OTP channel the user already
 * trusts for login: request a fresh code via `POST /api/auth/otp/request
 * { email: <their own email> }`, then submit it here alongside the new
 * PIN. A verified OTP is proof of identity strong enough to bypass
 * `currentPin`, and also clears any lockout — see docs/TRANSACTION_PIN.md.
 */
export async function POST(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { code, newPin } = parsed.data;

    if (!isValidPinFormat(newPin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { email: true },
    });

    const otpResult = await checkOtp(user.email, code);
    if (!otpResult.ok) {
      return NextResponse.json(
        { error: OTP_CHECK_MESSAGES[otpResult.reason], reason: otpResult.reason },
        { status: 401 },
      );
    }

    await prisma.otpCode.update({
      where: { id: otpResult.otpId },
      data: { consumedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: session.userId },
      data: { pinHash: await hashPin(newPin), pinFailedAttempts: 0, pinLockedUntil: null },
    });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
