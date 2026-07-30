import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/requireSession";
import { verifyMeter } from "@/lib/services/vtuProvider";
import { DISCOS } from "@/lib/electricity";

const bodySchema = z.object({
  disco: z.enum(DISCOS),
  meterNumber: z.string().min(5),
  meterType: z.enum(["PREPAID", "POSTPAID"]),
});

export async function POST(request: Request) {
  try {
    requireSession(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await verifyMeter(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not verify meter" }, { status: 502 });
  }
}
