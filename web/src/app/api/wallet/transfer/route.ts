import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toKobo } from "@/lib/wallet";
import { InsufficientBalanceError } from "@/lib/wallet";
import { transferFunds, RecipientNotFoundError, SelfTransferError } from "@/lib/transfer";
import { checkTransactionPin, pinCheckErrorMessage } from "@/lib/pin";

const bodySchema = z.object({
  toPhone: z.string().min(10).max(15),
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
    const { toPhone, amountNaira, pin } = parsed.data;

    const pinCheck = await checkTransactionPin(session.userId, pin);
    if (!pinCheck.ok) {
      return NextResponse.json(
        { error: pinCheckErrorMessage(pinCheck), code: `PIN_${pinCheck.reason}` },
        { status: pinCheck.reason === "LOCKED" ? 423 : 401 },
      );
    }

    const { senderTransaction } = await transferFunds({
      fromUserId: session.userId,
      toPhone,
      amountKobo: toKobo(amountNaira),
    });

    return NextResponse.json({
      transactionId: senderTransaction.id,
      reference: senderTransaction.reference,
      status: "SUCCESS",
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 });
    }
    if (err instanceof RecipientNotFoundError) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }
    if (err instanceof SelfTransferError) {
      return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
    }
    throw err;
  }
}
