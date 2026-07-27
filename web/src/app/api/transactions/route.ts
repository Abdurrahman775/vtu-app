import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toNaira } from "@/lib/wallet";

export async function GET(request: Request) {
  try {
    const session = requireSession(request);

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        provider: t.provider,
        amountNaira: toNaira(t.amountKobo),
        status: t.status,
        reference: t.reference,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
