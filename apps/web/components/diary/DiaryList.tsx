import type { EntryListItem } from "@jzmle/core";
import { EntryCard } from "@/components/diary/EntryCard";

export function DiaryList({ emptyText = "还没有符合条件的日记。", entries }: { emptyText?: string; entries: EntryListItem[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[#cabdff] bg-white/58 p-10 text-center text-sm text-[#777299] shadow-button">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {entries.map((entry) => (
        <EntryCard entry={entry} key={entry.id} />
      ))}
    </div>
  );
}
