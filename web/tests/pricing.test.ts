import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { priceWithMargin } from "@/lib/pricing";
import { resetDb } from "./helpers";

describe("priceWithMargin", () => {
  beforeEach(resetDb);
  afterAll(resetDb);

  it("charges the base amount with 0% margin when no PricingRule exists", async () => {
    const result = await priceWithMargin({
      service: "AIRTIME",
      provider: "MTN",
      baseAmountNaira: 1000,
    });

    expect(result.marginPercent).toBe(0);
    expect(result.chargeAmountNaira).toBe(1000);
    expect(result.chargeAmountKobo).toBe(100000n);
  });

  it("marks up the base amount by the configured margin", async () => {
    await prisma.pricingRule.create({
      data: { service: "AIRTIME", provider: "MTN", marginPercent: 10 },
    });

    const result = await priceWithMargin({
      service: "AIRTIME",
      provider: "MTN",
      baseAmountNaira: 1000,
    });

    expect(result.marginPercent).toBe(10);
    expect(result.chargeAmountNaira).toBe(1100);
    expect(result.chargeAmountKobo).toBe(110000n);
  });

  it("only applies the margin for the matching service+provider pair", async () => {
    await prisma.pricingRule.create({
      data: { service: "AIRTIME", provider: "MTN", marginPercent: 10 },
    });

    const result = await priceWithMargin({
      service: "AIRTIME",
      provider: "AIRTEL",
      baseAmountNaira: 1000,
    });

    expect(result.marginPercent).toBe(0);
    expect(result.chargeAmountNaira).toBe(1000);
  });
});
