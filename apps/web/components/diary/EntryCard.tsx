import Link from "next/link";
import type { EntryListItem } from "@jzmle/core";
import { CalendarDays, ChevronRight } from "lucide-react";
import { modeBorderColor } from "@/lib/diary-prototype";
import { Badge } from "@/components/ui/Badge";

export function EntryCard({ entry }: { entry: EntryListItem }) {
  const color = modeBorderColor(entry.mode);

  return (
    <Link className="block" href={`/entries/${entry.id}`}>
      <article className={`rounded-[1.4rem] border border-black/5 ${color} border-l-4 bg-white/75 p-5 shadow-gentle backdrop-blur transition hover:-translate-y-0.5 hover:bg-white`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-dusk">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} />
                {entry.date}
              </span>
              <Badge>{entry.modeLabel}</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{entry.title}</h3>
            <p className="mt-2 text-sm leading-7 text-dusk">{entry.summary}</p>
          </div>
          <ChevronRight className="mt-1 shrink-0 text-dusk/50" size={19} />
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
