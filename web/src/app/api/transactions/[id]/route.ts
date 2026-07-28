import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toNaira } from "@/lib/wallet";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction || transaction.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        provider: transaction.provider,
        amountNaira: toNaira(transaction.amountKobo),
        status: transaction.status,
        reference: transaction.reference,
        providerReference: transaction.providerReference,
        meta: transaction.meta,
        createdAt: transaction.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
