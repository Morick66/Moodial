"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EntryListItem } from "@jzmle/core";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchEntries } from "@/lib/entry-api";
import { fetchWeekSummary, type WeekSummary } from "@/lib/summary-api";

export function CalendarWorkspace() {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [nextEntries, nextSummary] = await Promise.all([fetchEntries(), fetchWeekSummary()]);
      if (!cancelled) setEntries(nextEntries);
      if (!cancelled) setWeekSummary(nextSummary);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const entriesByDay = useMemo(() => {
    const map = new Map<number, EntryListItem[]>();
    entries.forEach((entry) => {
      const date = new Date(`${entry.date}T00:00:00`);
      if (date.getFullYear() !== visibleMonth.getFullYear() || date.getMonth() !== visibleMonth.getMonth()) return;
      const dayEntries = map.get(date.getDate()) ?? [];
      map.set(date.getDate(), [...dayEntries, entry]);
    });
    return map;
  }, [entries, visibleMonth]);

  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const monthlyEntryCount = Array.from(entriesByDay.values()).reduce((total, dayEntries) => total + dayEntries.length, 0);
  const recordedDays = entriesByDay.size;
  const isCurrentMonth = visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() === today.getMonth();

  function changeMonth(monthOffset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + monthOffset, 1));
  }

  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="moodial-glass flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b4dff] to-[#ff9fc8] text-white shadow-button">
              <CalendarDays size={25} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#875cff]">情绪日历</p>
              <h2 className="mt-1 text-3xl font-black text-[#11163d]">
                {visibleMonth.getFullYear()} 年 {visibleMonth.getMonth() + 1} 月
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MonthStat label="记录" value={`${monthlyEntryCount} 篇`} />
            <MonthStat label="天数" value={`${recordedDays} 天`} />
            <MonthStat label="7 天" value={`${weekSummary?.entryCount ?? 0} 篇`} />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[#6f61a0] shadow-button transition hover:text-[#875cff]"
              onClick={() => changeMonth(-1)}
              title="上个月"
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="h-10 rounded-full bg-white/75 px-4 text-sm text-[#6f61a0] shadow-button transition hover:text-[#875cff] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isCurrentMonth}
              onClick={() => setVisibleMonth(startOfMonth(new Date()))}
              type="button"
            >
              今天
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[#6f61a0] shadow-button transition hover:text-[#875cff]"
              onClick={() => changeMonth(1)}
              title="下个月"
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="moodial-glass overflow-visible rounded-[1.75rem] p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-[#81799d] sm:text-sm">
            {["日", "一", "二", "三", "四", "五", "六"].map((weekday) => (
              <div className="py-2" key={weekday}>
                {weekday}
              </div>
            ))}
            {calendarCells.map((day, index) => {
              const dayEntries = day ? [...(entriesByDay.get(day) ?? [])].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()) : [];
              const dateKey = day ? toDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) : "";
              const isToday = dateKey === todayKey;
              const popoverAlign = index % 7 >= 5 ? "right-0" : "left-0";
              const content = (
                <div className="group relative">
                  <Link
                    className={`flex aspect-[1.05] min-h-[72px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition sm:min-h-[104px] sm:p-4 ${
                    dayEntries.length > 0
                      ? "border-[#eadfff] bg-gradient-to-br from-white to-[#fff1f8] text-ink shadow-card hover:-translate-y-0.5 hover:shadow-soft"
                      : "border-white/70 bg-white/42 text-[#9189aa] hover:bg-white/75"
                  } ${isToday ? "ring-2 ring-[#8b61ff]/45" : ""}`}
                    href={`/calendar/${dateKey}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-[#875cff] text-white" : "bg-white/70"}`}>
                        {day}
                      </span>
                      {dayEntries.length > 0 ? <Sparkles className="shrink-0 text-[#e979bb]" size={16} /> : null}
                    </div>
                    {dayEntries.length > 0 ? (
                      <div className="w-full min-w-0">
                        <p className="w-full truncate text-sm font-medium">{dayEntries[0].title}</p>
                        <p className="mt-1 text-xs text-[#81799d]">{dayEntries.length} 篇记录</p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#9b93ad]">{isToday ? "今天" : "未记录"}</span>
                    )}
                  </Link>
                  {dayEntries.length > 0 ? <DayEntryPopover align={popoverAlign} entries={dayEntries} /> : null}
                </div>
              );

              if (!day) return <div aria-hidden="true" className="aspect-[1.05] min-h-[72px] sm:min-h-[104px]" key={`blank-${index}`} />;
              return <div key={day}>{content}</div>;
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function DayEntryPopover({ align, entries }: { align: string; entries: EntryListItem[] }) {
  return (
    <div
      className={`pointer-events-none absolute top-[calc(100%+0.5rem)] z-30 hidden w-72 rounded-2xl border border-white/90 bg-white/95 p-3 text-left shadow-soft backdrop-blur group-hover:block group-focus-within:block ${align}`}
    >
      <p className="mb-2 px-1 text-xs text-[#81799d]">当天记录</p>
      <div className="grid gap-2">
        {entries.map((entry) => (
          <Link
            className="pointer-events-auto block rounded-xl bg-[#fbf6ff] px-3 py-2 transition hover:bg-[#f0e8ff]"
            href={`/entries/${entry.id}`}
            key={entry.id}
          >
            <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#81799d]">{entry.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MonthStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-2 shadow-button">
      <p className="text-[11px] text-[#81799d]">{label}</p>
      <p className="text-sm font-semibold text-[#11163d]">{value}</p>
    </div>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
