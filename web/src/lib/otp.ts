import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 15;
const OTP_RATE_LIMIT_MAX_REQUESTS = 10;

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Fixed code used whenever no real SMTP credentials are configured, so
 * local dev/testing doesn't require reading the server console for every
 * login. Only takes effect in that dev-stub path (see `sendOtpEmail`
 * below) — once `SMTP_USER`/`SMTP_PASS` are set, real random codes are
 * generated again.
 */
const DEV_STATIC_OTP = "123456";

export function generateOtpCode(): string {
  if (!isSmtpConfigured()) {
    return DEV_STATIC_OTP;
  }
  const max = 10 ** OTP_LENGTH;
  const code = Math.floor(Math.random() * max);
  return code.toString().padStart(OTP_LENGTH, "0");
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Caps how many OTPs can be requested for an email address within a
 * rolling window, using the `OtpCode` rows already persisted for every
 * request — no separate rate-limit store needed. Returns true if the
 * caller is still within the limit and may request another OTP.
 */
export async function checkOtpRateLimit(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.otpCode.count({
    where: { email, createdAt: { gte: windowStart } },
  });
  return recentCount < OTP_RATE_LIMIT_MAX_REQUESTS;
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export type OtpCheckResult =
  | { ok: true; otpId: string }
  | { ok: false; reason: "NOT_FOUND" | "ALREADY_USED" | "EXPIRED" | "SUPERSEDED" | "INCORRECT" };

export const OTP_CHECK_MESSAGES: Record<Exclude<OtpCheckResult, { ok: true }>["reason"], string> = {
  NOT_FOUND: "No verification code was requested for this email.",
  ALREADY_USED: "This code has already been used — request a new one.",
  EXPIRED: "This code has expired — request a new one.",
  SUPERSEDED: "A newer code was sent to your email — please use the latest one.",
  INCORRECT: "Incorrect code — please check and try again.",
};

/**
 * Checks a submitted code against the most recent OtpCode row for the
 * email, distinguishing *why* it failed (already used / expired /
 * superseded by a newer code / just wrong) instead of a single generic
 * "invalid" — codes are single-use, so re-submitting an already-consumed
 * one is a common, non-buggy way to land here and deserves a clearer
 * message than "invalid or expired".
 */
export async function checkOtp(email: string, code: string): Promise<OtpCheckResult> {
  const recent = await prisma.otpCode.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (recent.length === 0) return { ok: false, reason: "NOT_FOUND" };

  const [latest, ...older] = recent;
  if (await verifyOtpHash(code, latest.codeHash)) {
    if (latest.consumedAt) return { ok: false, reason: "ALREADY_USED" };
    if (latest.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };
    return { ok: true, otpId: latest.id };
  }

  for (const row of older) {
    if (await verifyOtpHash(code, row.codeHash)) {
      return { ok: false, reason: "SUPERSEDED" };
    }
  }

  return { ok: false, reason: "INCORRECT" };
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends the OTP via Gmail SMTP (a Google Account "App Password" is
 * required for SMTP_PASS, not the account's normal login password —
 * regular passwords are rejected by Gmail for SMTP auth). Stubbed for
 * local dev — logs to the server console instead of sending a real
 * email until SMTP_USER/SMTP_PASS are set.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[dev] OTP for ${email}: ${code}`);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your VTU App verification code",
    text: `Your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });
}
