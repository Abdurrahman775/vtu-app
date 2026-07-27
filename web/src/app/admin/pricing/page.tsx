export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PricingForm } from "./PricingForm";

export default async function AdminPricingPage() {
  const rules = await prisma.pricingRule.findMany({ orderBy: { service: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Pricing & Margins</h1>
      <PricingForm />
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">{r.service}</td>
                <td className="px-4 py-3">{r.provider}</td>
                <td className="px-4 py-3">{r.marginPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
