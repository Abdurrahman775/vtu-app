import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toNaira } from "@/lib/wallet";

export async function GET(request: Request) {
  try {
    const session = requireSession(request);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: session.userId } });

    return NextResponse.json({
      balanceKobo: wallet.balanceKobo.toString(),
      balanceNaira: toNaira(wallet.balanceKobo),
      currency: wallet.currency,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
