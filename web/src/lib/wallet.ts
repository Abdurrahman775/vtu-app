import { Prisma, LedgerEntryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient wallet balance");
    this.name = "InsufficientBalanceError";
  }
}

/**
 * Atomically moves money in/out of a wallet and writes the corresponding
 * ledger entry in the same DB transaction, so balance and ledger can never
 * drift apart. `amountKobo` is always positive; `type` determines direction.
 */
export async function postLedgerEntry(params: {
  userId: string;
  type: LedgerEntryType;
  amountKobo: bigint;
  reference: string;
  description: string;
  transactionId?: string;
}) {
  const { userId, type, amountKobo, reference, description, transactionId } = params;

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

    const balanceAfter =
      type === LedgerEntryType.CREDIT
        ? wallet.balanceKobo + amountKobo
        : wallet.balanceKobo - amountKobo;

    if (type === LedgerEntryType.DEBIT && balanceAfter < 0n) {
      throw new InsufficientBalanceError();
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balanceKobo: balanceAfter },
    });

    return tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type,
        amountKobo,
        balanceAfterKobo: balanceAfter,
        reference,
        description,
        transactionId,
      },
    });
  });
}

export function toKobo(nairaAmount: number): bigint {
  return BigInt(Math.round(nairaAmount * 100));
}

export function toNaira(kobo: bigint): number {
  return Number(kobo) / 100;
}

export type { Prisma };
