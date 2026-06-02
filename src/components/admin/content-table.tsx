import Link from "next/link";
import { transitionContentFormAction } from "@/app/admin/actions";
import { Icon } from "@/components/icon";
import type { AdminContext, ContentListItem, ContentStatus } from "@/lib/admin/types";

const transitionOptions: ContentStatus[] = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"];

export function ContentTable({ items, editBasePath, context }: { items: ContentListItem[]; editBasePath: string; context: AdminContext }) {
  const canTransition = (item: ContentListItem) => Boolean(context.member?.isOwner || item.createdBy === context.user?.id);
  return (
    <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
          <tr>
            {["Title", "Status", "Kind", "Author", "Updated", "Preview", "Workflow"].map((header) => (
              <th key={header} className="border-b border-white/10 px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-white/10">
              <td className="px-4 py-4">
                <Link href={`${item.kind === "guide" ? "/admin/guides" : editBasePath}?edit=${item.id}`} className="font-black text-white hover:text-gold">
                  {item.title}
                </Link>
                <p className="mt-1 font-mono text-xs text-white/45">{item.slug}</p>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-black text-gold">{item.status}</span>
              </td>
              <td className="px-4 py-4 text-white/70">{item.kind}</td>
              <td className="px-4 py-4 text-white/70">{item.authorName}</td>
              <td className="px-4 py-4 text-white/70">{item.updatedAt}</td>
              <td className="px-4 py-4">
                <Link
                  href={item.kind === "guide" ? `/guides/${item.slug}` : item.kind === "blog_post" ? `/blog/${item.slug}` : "/admin/dashboard"}
                  className="inline-flex items-center gap-2 text-sm font-black text-emerald"
                >
                  Open <Icon name="chevron" className="h-4 w-4" />
                </Link>
              </td>
              <td className="px-4 py-4">
                {canTransition(item) ? (
                  <form action={transitionContentFormAction} className="flex gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="note" value="Changed from admin table." />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-white/10 bg-[#061117] px-2 py-2 text-xs font-bold text-white">
                      {transitionOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <button className="rounded-md bg-emerald px-3 py-2 text-xs font-black text-white" type="submit">
                      Apply
                    </button>
                  </form>
                ) : (
                  <span className="text-xs font-bold text-white/45">No access</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? <div className="p-8 text-center text-sm font-bold text-white/60">No content has been created yet.</div> : null}
    </div>
  );
}
