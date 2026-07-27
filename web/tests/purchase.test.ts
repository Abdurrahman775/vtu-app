import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { debitAndPurchase, InsufficientBalanceError } from "@/lib/purchase";
import { resetDb, createUserWithWallet } from "./helpers";

describe("debitAndPurchase", () => {
  beforeEach(resetDb);
  afterAll(resetDb);

  it("debits the wallet and marks the transaction SUCCESS when the provider call succeeds", async () => {
    const user = await createUserWithWallet(100000n);

    const { transaction, result } = await debitAndPurchase({
      userId: user.id,
      type: "AIRTIME",
      provider: "MTN",
      amountKobo: 30000n,
      call: async () => ({ success: true, providerReference: "prov_1", message: "ok" }),
    });

    expect(result.success).toBe(true);
    expect(transaction.status).toBe("SUCCESS");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(wallet.balanceKobo).toBe(70000n);
  });

  it("refunds the debit and marks FAILED when the provider reports failure", async () => {
    const user = await createUserWithWallet(100000n);

    const { transaction } = await debitAndPurchase({
      userId: user.id,
      type: "AIRTIME",
      provider: "MTN",
      amountKobo: 30000n,
      call: async () => ({ success: false, providerReference: "prov_2", message: "declined" }),
    });

    expect(transaction.status).toBe("FAILED");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(wallet.balanceKobo).toBe(100000n);
  });

  it("refunds the debit and marks FAILED when the provider call throws", async () => {
    const user = await createUserWithWallet(100000n);

    await expect(
      debitAndPurchase({
        userId: user.id,
        type: "AIRTIME",
        provider: "MTN",
        amountKobo: 30000n,
        call: async () => {
          throw new Error("provider timeout");
        },
      }),
    ).rejects.toThrow("provider timeout");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(wallet.balanceKobo).toBe(100000n);

    const transaction = await prisma.transaction.findFirstOrThrow({ where: { userId: user.id } });
    expect(transaction.status).toBe("FAILED");
  });

  it("throws InsufficientBalanceError without calling the provider when the balance is too low", async () => {
    const user = await createUserWithWallet(1000n);
    let providerWasCalled = false;

    await expect(
      debitAndPurchase({
        userId: user.id,
        type: "AIRTIME",
        provider: "MTN",
        amountKobo: 30000n,
        call: async () => {
          providerWasCalled = true;
          return { success: true, providerReference: "x", message: "ok" };
        },
      }),
    ).rejects.toThrow(InsufficientBalanceError);

    expect(providerWasCalled).toBe(false);
  });
});
