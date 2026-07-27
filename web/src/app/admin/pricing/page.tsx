export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PricingForm } from "./PricingForm";

export default async function AdminPricingPage() {
  const rules = await prisma.pricingRule.findMany({ orderBy: { service: "asc" } });

  return (
    <div>
      <h1>Pricing & Margins</h1>
      <PricingForm />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Service</th>
            <th align="left">Provider</th>
            <th align="left">Margin %</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{r.service}</td>
              <td>{r.provider}</td>
              <td>{r.marginPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
