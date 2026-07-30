import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const PIN_REGEX = /^\d{4}$/;
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;

export function isValidPinFormat(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export type PinCheckResult =
  | { ok: true }
  | { ok: false; reason: "LOCKED"; retryAfterSeconds: number }
  | { ok: false; reason: "INCORRECT" };

/**
 * Gates a transfer/purchase behind the user's transaction PIN, if
 * they've set one. Optional by design (not collected at signup) — a
 * user with no `pinHash` yet can transact freely, matching how phone
 * number went from required to optional (docs/AUTH.md). Once a PIN is
 * set, every transfer/purchase route requires it going forward.
 *
 * Also enforces a lockout after MAX_PIN_ATTEMPTS consecutive wrong
 * guesses (a 4-digit PIN is brute-forceable in ~5000 tries otherwise) —
 * cleared by a correct PIN or by the OTP-gated reset flow
 * (POST /api/me/pin/reset, docs/TRANSACTION_PIN.md).
 */
export async function checkTransactionPin(userId: string, pin?: string): Promise<PinCheckResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { pinHash: true, pinFailedAttempts: true, pinLockedUntil: true },
  });

  if (!user.pinHash) return { ok: true };

  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    return {
      ok: false,
      reason: "LOCKED",
      retryAfterSeconds: Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 1000),
    };
  }

  if (pin && (await bcrypt.compare(pin, user.pinHash))) {
    if (user.pinFailedAttempts > 0 || user.pinLockedUntil) {
      await prisma.user.update({
        where: { id: userId },
        data: { pinFailedAttempts: 0, pinLockedUntil: null },
      });
    }
    return { ok: true };
  }

  const attempts = user.pinFailedAttempts + 1;
  const lockedOut = attempts >= MAX_PIN_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      pinFailedAttempts: lockedOut ? 0 : attempts,
      pinLockedUntil: lockedOut
        ? new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000)
        : null,
    },
  });

  if (lockedOut) {
    return { ok: false, reason: "LOCKED", retryAfterSeconds: PIN_LOCKOUT_MINUTES * 60 };
  }
  return { ok: false, reason: "INCORRECT" };
}

export function pinCheckErrorMessage(result: Extract<PinCheckResult, { ok: false }>): string {
  if (result.reason === "LOCKED") {
    const minutes = Math.ceil(result.retryAfterSeconds / 60);
    return `Too many incorrect PIN attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or reset your PIN.`;
  }
  return "Incorrect transaction PIN";
}
