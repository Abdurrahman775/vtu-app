import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 15;
const OTP_RATE_LIMIT_MAX_REQUESTS = 3;

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const code = Math.floor(Math.random() * max);
  return code.toString().padStart(OTP_LENGTH, "0");
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Caps how many OTPs can be requested for a phone number within a
 * rolling window, using the `OtpCode` rows already persisted for every
 * request — no separate rate-limit store needed. Returns true if the
 * caller is still within the limit and may request another OTP.
 */
export async function checkOtpRateLimit(phone: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.otpCode.count({
    where: { phone, createdAt: { gte: windowStart } },
  });
  return recentCount < OTP_RATE_LIMIT_MAX_REQUESTS;
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Sends the OTP via the configured SMS provider. Stubbed for local dev —
 * logs to the server console instead of calling out to a real provider
 * until SMS_PROVIDER_API_KEY is set.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    console.log(`[dev] OTP for ${phone}: ${code}`);
    return;
  }

  throw new Error("SMS provider integration not implemented yet");
}
