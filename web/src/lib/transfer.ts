import { randomUUID } from "crypto";
import { LedgerEntryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { InsufficientBalanceError, toNaira } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

export class RecipientNotFoundError extends Error {
  constructor() {
    super("Recipient not found");
    this.name = "RecipientNotFoundError";
  }
}

export class SelfTransferError extends Error {
  constructor() {
    super("Cannot transfer to yourself");
    this.name = "SelfTransferError";
  }
}

/**
 * Wallet-to-wallet transfer between two app users. Unlike
 * `postLedgerEntry` (one wallet at a time), this debits and credits both
 * wallets inside a single `$transaction` so the transfer can never leave
 * only one side applied.
 */
export async function transferFunds(params: {
  fromUserId: string;
  toPhone: string;
  amountKobo: bigint;
}) {
  const { fromUserId, toPhone, amountKobo } = params;

  const recipient = await prisma.user.findUnique({ where: { phone: toPhone } });
  if (!recipient) throw new RecipientNotFoundError();
  if (recipient.id === fromUserId) throw new SelfTransferError();

  const sender = await prisma.user.findUniqueOrThrow({ where: { id: fromUserId } });
  // Newer accounts may not have a phone (no longer collected at signup —
  // see docs/AUTH.md); fall back to something identifiable for the
  // counterparty-facing description/notification text below.
  const senderLabel = sender.phone ?? sender.email;

  const reference = `transfer_${randomUUID()}`;

  const result = await prisma.$transaction(async (tx) => {
    const senderWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: fromUserId } });
    const senderBalanceAfter = senderWallet.balanceKobo - amountKobo;
    if (senderBalanceAfter < 0n) throw new InsufficientBalanceError();

    const receiverWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: recipient.id } });
    const receiverBalanceAfter = receiverWallet.balanceKobo + amountKobo;

    await tx.wallet.update({
      where: { id: senderWallet.id },
      data: { balanceKobo: senderBalanceAfter },
    });
    await tx.wallet.update({
      where: { id: receiverWallet.id },
      data: { balanceKobo: receiverBalanceAfter },
    });

    const senderTransaction = await tx.transaction.create({
      data: {
        userId: fromUserId,
        type: "TRANSFER",
        provider: "WALLET",
        amountKobo,
        status: "SUCCESS",
        reference: `${reference}_out`,
        meta: { direction: "debit", counterpartyPhone: toPhone },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        walletId: senderWallet.id,
        type: LedgerEntryType.DEBIT,
        amountKobo,
        balanceAfterKobo: senderBalanceAfter,
        reference: `ledger_${reference}_out`,
        description: `Transfer to ${toPhone}`,
        transactionId: senderTransaction.id,
      },
    });

    const receiverTransaction = await tx.transaction.create({
      data: {
        userId: recipient.id,
        type: "TRANSFER",
        provider: "WALLET",
        amountKobo,
        status: "SUCCESS",
        reference: `${reference}_in`,
        meta: { direction: "credit", counterpartyPhone: senderLabel },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        walletId: receiverWallet.id,
        type: LedgerEntryType.CREDIT,
        amountKobo,
        balanceAfterKobo: receiverBalanceAfter,
        reference: `ledger_${reference}_in`,
        description: `Transfer from ${senderLabel}`,
        transactionId: receiverTransaction.id,
      },
    });

    return { senderTransaction, receiverTransaction };
  });

  await notifyTransfer({
    fromUserId,
    fromPhone: senderLabel,
    toUserId: recipient.id,
    toPhone,
    amountKobo,
  });

  return result;
}

async function notifyTransfer(params: {
  fromUserId: string;
  fromPhone: string;
  toUserId: string;
  toPhone: string;
  amountKobo: bigint;
}) {
  const { fromUserId, fromPhone, toUserId, toPhone, amountKobo } = params;
  const amountNaira = toNaira(amountKobo).toLocaleString();
  try {
    await createNotification({
      userId: fromUserId,
      type: "TRANSFER",
      title: "Transfer sent",
      body: `You sent ₦${amountNaira} to ${toPhone}.`,
    });
    await createNotification({
      userId: toUserId,
      type: "TRANSFER",
      title: "Transfer received",
      body: `You received ₦${amountNaira} from ${fromPhone}.`,
    });
  } catch {
    // best-effort — the transfer already committed, don't fail the request over this
  }
}
