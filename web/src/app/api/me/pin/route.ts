import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { checkTransactionPin, hashPin, isValidPinFormat, pinCheckErrorMessage } from "@/lib/pin";

const bodySchema = z.object({
  currentPin: z.string().optional(),
  newPin: z.string(),
});

/**
 * Sets a transaction PIN for the first time, or changes an existing
 * one — a single endpoint handles both: `currentPin` is required (and
 * checked) only if the account already has one, same shape as a normal
 * "change password" flow. See docs/TRANSACTION_PIN.md.
 */
export async function POST(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { currentPin, newPin } = parsed.data;

    if (!isValidPinFormat(newPin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    const pinCheck = await checkTransactionPin(session.userId, currentPin);
    if (!pinCheck.ok) {
      const message =
        pinCheck.reason === "LOCKED" ? pinCheckErrorMessage(pinCheck) : "Current PIN is incorrect";
      return NextResponse.json(
        { error: message, code: `PIN_${pinCheck.reason}` },
        { status: pinCheck.reason === "LOCKED" ? 423 : 401 },
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { pinHash: await hashPin(newPin) },
    });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
