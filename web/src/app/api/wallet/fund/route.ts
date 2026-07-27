import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toKobo } from "@/lib/wallet";
import { initializePaystackTransaction } from "@/lib/services/paystack";

const bodySchema = z.object({
  amountNaira: z.number().positive(),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const session = requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { amountNaira, email } = parsed.data;
    const amountKobo = toKobo(amountNaira);
    const reference = `fund_${randomUUID()}`;

    await prisma.transaction.create({
      data: {
        userId: session.userId,
        type: "WALLET_FUNDING",
        provider: "PAYSTACK",
        amountKobo,
        reference,
        status: "PENDING",
      },
    });

    const paystackRes = await initializePaystackTransaction({ email, amountKobo, reference });

    return NextResponse.json({
      authorizationUrl: paystackRes.data.authorization_url,
      reference,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
