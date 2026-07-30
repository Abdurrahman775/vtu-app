import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { toNaira } from "@/lib/wallet";

const STATEMENT_MAX_MONTHS_BACK = 3;

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

function threeMonthsAgo(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - STATEMENT_MAX_MONTHS_BACK);
  return date;
}

export async function GET(request: Request) {
  try {
    const session = requireSession(request);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }
    const { from, to } = parsed.data;

    const earliestAllowed = threeMonthsAgo();
    if (from && new Date(from) < earliestAllowed) {
      return NextResponse.json(
        { error: "Statements can only cover up to 3 months back" },
        { status: 400 },
      );
    }
    if (from && to && new Date(from) > new Date(to)) {
      return NextResponse.json({ error: "'from' must be before 'to'" }, { status: 400 });
    }

    const hasDateRange = Boolean(from || to);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        ...(hasDateRange && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      orderBy: { createdAt: "desc" },
      // A date-bounded statement request (capped at 3 months) can return
      // everything in range; the default recent-activity list stays
      // capped at 50 like before.
      take: hasDateRange ? undefined : 50,
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
