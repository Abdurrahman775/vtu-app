import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toKobo } from "@/lib/wallet";
import { debitAndPurchase, InsufficientBalanceError } from "@/lib/purchase";
import { purchaseCableSubscription } from "@/lib/services/vtuProvider";

const bodySchema = z.object({
  provider: z.enum(["DSTV", "GOTV", "STARTIMES"]),
  smartCardNumber: z.string().min(5),
  planCode: z.string(),
  amountNaira: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { provider, smartCardNumber, planCode, amountNaira } = parsed.data;
    const amountKobo = toKobo(amountNaira);

    const { transaction, result } = await debitAndPurchase({
      userId: session.userId,
      type: "CABLE_TV",
      provider,
      amountKobo,
      meta: { smartCardNumber, planCode },
      call: (reference) =>
        purchaseCableSubscription({ provider, smartCardNumber, planCode, reference }),
    });

    return NextResponse.json({
      transactionId: transaction.id,
      reference: transaction.reference,
      status: result.success ? "SUCCESS" : "FAILED",
      message: result.message,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 });
    }
    throw err;
  }
}
