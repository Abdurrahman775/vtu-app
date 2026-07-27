import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { postLedgerEntry } from "@/lib/wallet";
import { LedgerEntryType } from "@prisma/client";

/**
 * Paystack signs the raw request body with the secret key (HMAC SHA512) and
 * sends it in x-paystack-signature. Must verify before trusting the payload.
 */
function isValidSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const reference: string = event.data.reference;

    const transaction = await prisma.transaction.findUnique({ where: { reference } });
    if (!transaction || transaction.status !== "PENDING") {
      return NextResponse.json({ message: "Ignored" });
    }

    await postLedgerEntry({
      userId: transaction.userId,
      type: LedgerEntryType.CREDIT,
      amountKobo: transaction.amountKobo,
      reference: `ledger_${reference}`,
      description: "Wallet funding via Paystack",
      transactionId: transaction.id,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "SUCCESS", providerReference: event.data.id?.toString() },
    });
  }

  return NextResponse.json({ message: "OK" });
}
