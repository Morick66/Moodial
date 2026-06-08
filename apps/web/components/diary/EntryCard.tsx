import Link from "next/link";
import type { EntryListItem } from "@jzmle/core";
import { CalendarDays, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const modeDots: Record<string, string> = {
  happy: "bg-[#ffd775]",
  angry: "bg-[#ff8a78]",
  sad: "bg-[#8ab5ff]",
  messy: "bg-[#aa8cff]"
};

export function EntryCard({ entry }: { entry: EntryListItem }) {
  return (
    <Link className="block" href={`/entries/${entry.id}`}>
      <article className="relative overflow-hidden rounded-[1.45rem] border border-white/80 bg-gradient-to-br from-white/82 to-[#fff5fb]/72 p-5 shadow-gentle backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
        <span className={`absolute left-0 top-0 h-full w-1.5 ${modeDots[entry.mode] ?? "bg-[#d8c9ff]"}`} />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#81799d]">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} />
                {entry.date}
              </span>
              <Badge>{entry.modeLabel}</Badge>
              {entry.privacyLevel === "locked" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e8ddff] bg-white/72 px-2.5 py-1 text-xs font-medium text-[#756ca0]">
                  <Lock size={12} /> 已锁定
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{entry.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[#6f688c]">{entry.summary}</p>
          </div>
          <ChevronRight className="mt-1 shrink-0 text-[#8b80a7]" size={19} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </article>
    </Link>
  );
}
