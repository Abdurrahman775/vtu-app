import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.notification.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
}

let userCounter = 0;

export async function createUserWithWallet(balanceKobo = 0n) {
  userCounter += 1;
  const user = await prisma.user.create({
    data: {
      phone: `0800000${String(userCounter).padStart(4, "0")}`,
      email: `test-user-${userCounter}@example.com`,
      wallet: { create: { balanceKobo } },
    },
    include: { wallet: true },
  });
  return user;
}
