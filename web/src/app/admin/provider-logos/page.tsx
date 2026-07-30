export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { UploadLogoForm } from "./UploadLogoForm";
import { DeleteLogoButton } from "./DeleteLogoButton";

export default async function AdminProviderLogosPage() {
  const logos = await prisma.providerLogo.findMany({ orderBy: { provider: "asc" } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Provider Logos</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Upload a real logo for a provider (MTN, DSTV, a disco, etc.) and the mobile app shows it
        instead of the generated color badge everywhere that provider appears. Only upload images
        you have the rights to use.
      </p>

      <UploadLogoForm />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Logo</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {logos.map((logo) => (
              <tr key={logo.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.imageUrl}
                    alt={logo.provider}
                    className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{logo.provider}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {logo.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <DeleteLogoButton provider={logo.provider} />
                </td>
              </tr>
            ))}
            {logos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                  No custom logos uploaded yet — every provider is showing its generated color badge.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
