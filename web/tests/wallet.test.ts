import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { postLedgerEntry, toKobo, toNaira, InsufficientBalanceError } from "@/lib/wallet";
import { LedgerEntryType } from "@prisma/client";
import { resetDb, createUserWithWallet } from "./helpers";

describe("toKobo / toNaira", () => {
  it("converts naira to kobo without float drift", () => {
    expect(toKobo(1000)).toBe(100000n);
    expect(toKobo(19.99)).toBe(1999n);
    expect(toKobo(0.1)).toBe(10n);
  });

  it("converts kobo back to naira", () => {
    expect(toNaira(100000n)).toBe(1000);
    expect(toNaira(1999n)).toBeCloseTo(19.99);
  });
});

describe("postLedgerEntry", () => {
  beforeEach(resetDb);
  afterAll(resetDb);

  it("credits a wallet and records the resulting balance on the ledger entry", async () => {
    const user = await createUserWithWallet(0n);

    const entry = await postLedgerEntry({
      userId: user.id,
      type: LedgerEntryType.CREDIT,
      amountKobo: 50000n,
      reference: "test_credit_1",
      description: "test credit",
    });

    expect(entry.balanceAfterKobo).toBe(50000n);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(wallet.balanceKobo).toBe(50000n);
  });

  it("debits a wallet when there's enough balance", async () => {
    const user = await createUserWithWallet(50000n);

    await postLedgerEntry({
      userId: user.id,
      type: LedgerEntryType.DEBIT,
      amountKobo: 20000n,
      reference: "test_debit_1",
      description: "test debit",
    });

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(wallet.balanceKobo).toBe(30000n);
  });

  it("throws InsufficientBalanceError and leaves the balance untouched when a debit would go negative", async () => {
    const user = await createUserWithWallet(10000n);

    await expect(
      postLedgerEntry({
        userId: user.id,
        type: LedgerEntryType.DEBIT,
        amountKobo: 20000n,
        reference: "test_debit_fail",
        description: "should fail",
      }),
    ).rejects.toThrow(InsufficientBalanceError);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(wallet.balanceKobo).toBe(10000n);

    const ledgerCount = await prisma.ledgerEntry.count({ where: { walletId: user.wallet!.id } });
    expect(ledgerCount).toBe(0);
  });
});
