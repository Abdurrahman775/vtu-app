import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { InsufficientBalanceError } from "@/lib/wallet";
import { debitAndPurchase } from "@/lib/purchase";
import { priceWithMargin } from "@/lib/pricing";
import { purchaseData } from "@/lib/services/vtuProvider";
import { checkTransactionPin, pinCheckErrorMessage } from "@/lib/pin";

const bodySchema = z.object({
  network: z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"]),
  phone: z.string().min(10).max(15),
  planCode: z.string(),
  amountNaira: z.number().positive(),
  pin: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { network, phone, planCode, amountNaira, pin } = parsed.data;

    const pinCheck = await checkTransactionPin(session.userId, pin);
    if (!pinCheck.ok) {
      return NextResponse.json(
        { error: pinCheckErrorMessage(pinCheck), code: `PIN_${pinCheck.reason}` },
        { status: pinCheck.reason === "LOCKED" ? 423 : 401 },
      );
    }

    const { marginPercent, chargeAmountNaira, chargeAmountKobo } = await priceWithMargin({
      service: "DATA",
      provider: network,
      baseAmountNaira: amountNaira,
    });

    const { transaction, result } = await debitAndPurchase({
      userId: session.userId,
      type: "DATA",
      provider: network,
      amountKobo: chargeAmountKobo,
      meta: { phone, planCode, baseAmountNaira: amountNaira, marginPercent },
      call: (reference) => purchaseData({ network, phone, planCode, reference }),
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
