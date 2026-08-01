export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { UpsertLinkForm } from "./UpsertLinkForm";
import { DeleteLinkButton } from "./DeleteLinkButton";

export default async function AdminSocialLinksPage() {
  const links = await prisma.socialLink.findMany({ orderBy: { platform: "asc" } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Social Links</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        The mobile Profile screen&apos;s &quot;Follow us&quot; section only shows a platform once
        it has a link here — remove a link to hide it again.
      </p>

      <UpsertLinkForm />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{link.platform}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {link.url}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {link.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <DeleteLinkButton platform={link.platform} />
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                  No social links set yet — the Profile screen&apos;s &quot;Follow us&quot; section is hidden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
