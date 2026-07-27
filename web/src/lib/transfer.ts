import { randomUUID } from "crypto";
import { LedgerEntryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { InsufficientBalanceError } from "@/lib/wallet";

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

  const reference = `transfer_${randomUUID()}`;

  return prisma.$transaction(async (tx) => {
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
        meta: { direction: "debit", counterpartyPhone: recipient.phone },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        walletId: senderWallet.id,
        type: LedgerEntryType.DEBIT,
        amountKobo,
        balanceAfterKobo: senderBalanceAfter,
        reference: `ledger_${reference}_out`,
        description: `Transfer to ${recipient.phone}`,
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
        meta: { direction: "credit", counterpartyPhone: senderWallet.userId },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        walletId: receiverWallet.id,
        type: LedgerEntryType.CREDIT,
        amountKobo,
        balanceAfterKobo: receiverBalanceAfter,
        reference: `ledger_${reference}_in`,
        description: `Transfer from sender`,
        transactionId: receiverTransaction.id,
      },
    });

    return { senderTransaction, receiverTransaction };
  });
}
