import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";
import { postLedgerEntry, toNaira } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
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

    try {
      const label = updated.type.replace(/_/g, " ").toLowerCase();
      const amountNaira = toNaira(updated.amountKobo).toLocaleString();
      await createNotification({
        userId: updated.userId,
        type: "TRANSACTION",
        title: parsed.data.resolution === "SUCCESS" ? "Transaction confirmed" : "Transaction failed",
        body:
          parsed.data.resolution === "SUCCESS"
            ? `Your ${label} of ₦${amountNaira} was confirmed.`
            : `Your ${label} of ₦${amountNaira} failed${updated.type !== "WALLET_FUNDING" ? " and has been refunded" : ""}.`,
        meta: { transactionId: updated.id },
      });
    } catch {
      // best-effort — resolution already applied, don't fail the request over this
    }

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
