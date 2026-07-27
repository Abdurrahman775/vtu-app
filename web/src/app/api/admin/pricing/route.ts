import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError } from "@/lib/requireSession";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const rules = await prisma.pricingRule.findMany({ orderBy: { service: "asc" } });
    return NextResponse.json({ rules });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}

const bodySchema = z.object({
  service: z.enum(["WALLET_FUNDING", "AIRTIME", "DATA", "CABLE_TV"]),
  provider: z.string(),
  marginPercent: z.number().min(0).max(100),
});

export async function PUT(request: Request) {
  try {
    requireAdmin(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { service, provider, marginPercent } = parsed.data;

    const rule = await prisma.pricingRule.upsert({
      where: { service_provider: { service, provider } },
      update: { marginPercent },
      create: { service, provider, marginPercent },
    });

    return NextResponse.json({ rule });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}
