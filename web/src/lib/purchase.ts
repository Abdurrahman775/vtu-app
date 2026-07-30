import { randomUUID } from "crypto";
import { LedgerEntryType, TransactionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postLedgerEntry, InsufficientBalanceError, toNaira } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import type { VtuPurchaseResult } from "@/lib/services/vtuProvider";

export { InsufficientBalanceError };

/**
 * Shared flow for airtime/data/cable: debit wallet up-front, call the
 * provider, then mark the transaction SUCCESS or reverse the debit on
 * failure. Keeps the ledger and transaction status always in sync.
 */
export async function debitAndPurchase(params: {
  userId: string;
  type: TransactionType;
  provider: string;
  amountKobo: bigint;
  meta?: Prisma.InputJsonValue;
  call: (reference: string) => Promise<VtuPurchaseResult>;
}) {
  const { userId, type, provider, amountKobo, meta, call } = params;
  const reference = `${type.toLowerCase()}_${randomUUID()}`;

  let transaction = await prisma.transaction.create({
    data: { userId, type, provider, amountKobo, reference, status: "PENDING", meta },
  });

  await postLedgerEntry({
    userId,
    type: LedgerEntryType.DEBIT,
    amountKobo,
    reference: `ledger_${reference}`,
    description: `${type} purchase via ${provider}`,
    transactionId: transaction.id,
  });

  try {
    const result = await call(reference);

    transaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        providerReference: result.providerReference,
      },
    });

    if (!result.success) {
      await postLedgerEntry({
        userId,
        type: LedgerEntryType.CREDIT,
        amountKobo,
        reference: `refund_${reference}`,
        description: `Refund for failed ${type} purchase`,
      });
    }

    await notifyPurchaseResult({ userId, type, provider, amountKobo, success: result.success });

    return { transaction, result };
  } catch (err) {
    transaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    await postLedgerEntry({
      userId,
      type: LedgerEntryType.CREDIT,
      amountKobo,
      reference: `refund_${reference}`,
      description: `Refund for failed ${type} purchase`,
    });
    await notifyPurchaseResult({ userId, type, provider, amountKobo, success: false });
    throw err;
  }
}

/** Notification failures must never break the debit/refund flow above. */
async function notifyPurchaseResult(params: {
  userId: string;
  type: TransactionType;
  provider: string;
  amountKobo: bigint;
  success: boolean;
}) {
  const { userId, type, provider, amountKobo, success } = params;
  const label = type.replace(/_/g, " ").toLowerCase();
  try {
    await createNotification({
      userId,
      type: "TRANSACTION",
      title: success ? "Purchase successful" : "Purchase failed",
      body: success
        ? `Your ${label} purchase of ₦${toNaira(amountKobo).toLocaleString()} via ${provider} was successful.`
        : `Your ${label} purchase of ₦${toNaira(amountKobo).toLocaleString()} via ${provider} failed and has been refunded.`,
      meta: { transactionType: type, provider, amountKobo: amountKobo.toString() },
    });
  } catch {
    // best-effort — purchase already succeeded/refunded, don't fail the request over this
  }
}
