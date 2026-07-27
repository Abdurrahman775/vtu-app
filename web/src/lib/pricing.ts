import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toKobo } from "@/lib/wallet";

/**
 * Looks up the admin-configured margin for a (service, provider) pair
 * and marks up the base cost accordingly. Customers are charged
 * `baseAmountNaira * (1 + marginPercent/100)`; the VTU provider is still
 * called with the original base amount, since that's what it actually
 * charges the reseller.
 */
export async function priceWithMargin(params: {
  service: TransactionType;
  provider: string;
  baseAmountNaira: number;
}) {
  const rule = await prisma.pricingRule.findUnique({
    where: { service_provider: { service: params.service, provider: params.provider } },
  });
  const marginPercent = rule?.marginPercent ?? 0;
  const chargeAmountNaira = params.baseAmountNaira * (1 + marginPercent / 100);

  return {
    marginPercent,
    chargeAmountNaira,
    chargeAmountKobo: toKobo(chargeAmountNaira),
  };
}
