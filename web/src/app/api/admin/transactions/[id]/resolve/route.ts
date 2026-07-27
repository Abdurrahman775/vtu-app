import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";
import { postLedgerEntry } from "@/lib/wallet";
import { LedgerEntryType } from "@prisma/client";

const bodySchema = z.object({
  resolution: z.enum(["SUCCESS", "FAILED"]),
});

type RouteContext = { params: Promise<{ id: string }> };

/** Lets an admin manually resolve a PENDING transaction stuck on a provider timeout. */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    if (transaction.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction is not pending" }, { status: 409 });
    }

    if (parsed.data.resolution === "FAILED" && transaction.type !== "WALLET_FUNDING") {
      await postLedgerEntry({
        userId: transaction.userId,
        type: LedgerEntryType.CREDIT,
        amountKobo: transaction.amountKobo,
        reference: `refund_manual_${transaction.reference}`,
        description: "Manual admin refund for failed transaction",
      });
    }

    if (parsed.data.resolution === "SUCCESS" && transaction.type === "WALLET_FUNDING") {
      await postLedgerEntry({
        userId: transaction.userId,
        type: LedgerEntryType.CREDIT,
        amountKobo: transaction.amountKobo,
        reference: `ledger_manual_${transaction.reference}`,
        description: "Manual admin confirmation of wallet funding",
      });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status: parsed.data.resolution },
    });

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
