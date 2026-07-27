import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { transferFunds, RecipientNotFoundError, SelfTransferError } from "@/lib/transfer";
import { InsufficientBalanceError } from "@/lib/wallet";
import { resetDb, createUserWithWallet } from "./helpers";

describe("transferFunds", () => {
  beforeEach(resetDb);
  afterAll(resetDb);

  it("moves money atomically from sender to recipient", async () => {
    const sender = await createUserWithWallet(100000n);
    const recipient = await createUserWithWallet(0n);

    await transferFunds({ fromUserId: sender.id, toPhone: recipient.phone, amountKobo: 30000n });

    const senderWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: sender.id } });
    const recipientWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: recipient.id } });

    expect(senderWallet.balanceKobo).toBe(70000n);
    expect(recipientWallet.balanceKobo).toBe(30000n);
  });

  it("creates one TRANSFER transaction per side", async () => {
    const sender = await createUserWithWallet(100000n);
    const recipient = await createUserWithWallet(0n);

    await transferFunds({ fromUserId: sender.id, toPhone: recipient.phone, amountKobo: 30000n });

    const senderTx = await prisma.transaction.findFirstOrThrow({ where: { userId: sender.id } });
    const recipientTx = await prisma.transaction.findFirstOrThrow({ where: { userId: recipient.id } });

    expect(senderTx.type).toBe("TRANSFER");
    expect(senderTx.status).toBe("SUCCESS");
    expect(recipientTx.type).toBe("TRANSFER");
    expect(recipientTx.status).toBe("SUCCESS");
  });

  it("rejects transfers to yourself", async () => {
    const user = await createUserWithWallet(100000n);

    await expect(
      transferFunds({ fromUserId: user.id, toPhone: user.phone, amountKobo: 1000n }),
    ).rejects.toThrow(SelfTransferError);
  });

  it("rejects transfers to an unknown phone number", async () => {
    const sender = await createUserWithWallet(100000n);

    await expect(
      transferFunds({ fromUserId: sender.id, toPhone: "0899999999", amountKobo: 1000n }),
    ).rejects.toThrow(RecipientNotFoundError);
  });

  it("rejects transfers that would overdraw the sender and leaves both wallets untouched", async () => {
    const sender = await createUserWithWallet(1000n);
    const recipient = await createUserWithWallet(0n);

    await expect(
      transferFunds({ fromUserId: sender.id, toPhone: recipient.phone, amountKobo: 5000n }),
    ).rejects.toThrow(InsufficientBalanceError);

    const senderWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: sender.id } });
    const recipientWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: recipient.id } });

    expect(senderWallet.balanceKobo).toBe(1000n);
    expect(recipientWallet.balanceKobo).toBe(0n);
  });
});
