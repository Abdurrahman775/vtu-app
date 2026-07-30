import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { InsufficientBalanceError } from "@/lib/wallet";
import { debitAndPurchase } from "@/lib/purchase";
import { priceWithMargin } from "@/lib/pricing";
import { purchaseExamPin } from "@/lib/services/vtuProvider";

const bodySchema = z.object({
  examBody: z.enum(["WAEC", "NECO"]),
  quantity: z.number().int().positive(),
  amountNaira: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { examBody, quantity, amountNaira } = parsed.data;

    const { marginPercent, chargeAmountNaira, chargeAmountKobo } = await priceWithMargin({
      service: "EXAM_PIN",
      provider: examBody,
      baseAmountNaira: amountNaira,
    });

    const { transaction, result } = await debitAndPurchase({
      userId: session.userId,
      type: "EXAM_PIN",
      provider: examBody,
      amountKobo: chargeAmountKobo,
      meta: { quantity, baseAmountNaira: amountNaira, marginPercent },
      call: (reference) => purchaseExamPin({ examBody, quantity, reference }),
    });

    return NextResponse.json({
      transactionId: transaction.id,
      reference: transaction.reference,
      amountChargedNaira: chargeAmountNaira,
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
