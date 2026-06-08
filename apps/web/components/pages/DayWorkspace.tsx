"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EntryListItem } from "@jzmle/core";
import { ArrowLeft, CalendarDays, NotebookPen } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryCard } from "@/components/diary/EntryCard";
import { fetchEntries } from "@/lib/entry-api";

export function DayWorkspace({ date }: { date: string }) {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextEntries = await fetchEntries();
        if (!cancelled) setEntries(nextEntries);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dayEntries = useMemo(
    () => entries.filter((entry) => entry.date === date).sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    [date, entries]
  );
  const displayDate = formatDisplayDate(date);

  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="rounded-[1.75rem] border border-white/80 bg-white/65 p-5 shadow-gentle backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rosewood text-white shadow-button">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-sm text-dusk">日期回看</p>
                <h2 className="mt-1 text-3xl font-semibold">{displayDate}</h2>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/75 px-4 text-sm text-dusk shadow-button transition hover:text-rosewood" href="/calendar">
                <ArrowLeft size={16} />
                回日历
              </Link>
              <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button" href="/record">
                <NotebookPen size={16} />
                记录今天
              </Link>
            </div>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-gentle backdrop-blur sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-dusk">当天记录</p>
              <h3 className="mt-1 text-xl font-semibold">{loading ? "正在翻开这一天..." : `${dayEntries.length} 篇记录`}</h3>
            </div>
          </div>

          {loading ? (
            <p className="rounded-[1.5rem] bg-white/65 p-8 text-sm text-dusk">正在读取这一天的日记...</p>
          ) : dayEntries.length > 0 ? (
            <div className="grid gap-4">
              {dayEntries.map((entry) => (
                <EntryCard entry={entry} key={entry.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-rosewood/20 bg-white/65 p-8">
              <p className="text-sm leading-7 text-dusk">这一天还没有记录。可以之后补一笔，也可以回日历看看别的日子。</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button" href="/record">
                  <NotebookPen size={16} />
                  补一条
                </Link>
                <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/75 px-4 text-sm text-dusk shadow-button" href="/calendar">
                  <CalendarDays size={16} />
                  回日历
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function formatDisplayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getFullYear()} 年 ${parsed.getMonth() + 1} 月 ${parsed.getDate()} 日`;
}
