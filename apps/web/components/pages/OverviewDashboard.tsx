"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EntryListItem } from "@jzmle/core";
import { ArrowRight, CalendarDays, HeartHandshake, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryCard } from "@/components/diary/EntryCard";
import { fetchEntries } from "@/lib/entry-api";

export function OverviewDashboard() {
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

  const latestEntry = entries[0];
  const weekCount = useMemo(() => entries.slice(0, 7).length, [entries]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-7 shadow-gentle backdrop-blur sm:p-10">
          <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full bg-blush/70 blur-2xl sm:block" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sage/70 px-3 py-1 text-sm text-moss">
              <HeartHandshake size={16} />
              今日入口
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">今天你想怎么被接住？</h2>
            <p className="mt-5 text-base leading-8 text-dusk">
              不用写完整，也不用解释清楚。先选一个感觉，聊几句，系统会帮你把今天整理成可以回看的日记。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="inline-flex h-12 items-center gap-2 rounded-full bg-rosewood px-5 text-sm font-medium text-white shadow-button" href="/record">
                开始记录
                <ArrowRight size={18} />
              </Link>
              <Link className="inline-flex h-12 items-center gap-2 rounded-full bg-white/70 px-5 text-sm font-medium text-rosewood shadow-button" href="/entries">
                看看最近
                <CalendarDays size={18} />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/80 bg-white/55 p-5 shadow-gentle backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-dusk">最近一篇</p>
                <h3 className="mt-1 text-xl font-semibold">刚刚放下的心事</h3>
              </div>
              <Link className="text-sm text-rosewood" href="/entries">
                全部日记
              </Link>
            </div>
            {loading ? (
              <p className="rounded-[1.5rem] bg-white/60 p-8 text-sm text-dusk">正在翻开日记本...</p>
            ) : latestEntry ? (
              <EntryCard entry={latestEntry} />
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-rosewood/20 bg-white/60 p-8 text-sm leading-7 text-dusk">
                还没有日记。今晚可以从一句“今天有点乱”开始。
              </p>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white/55 p-5 shadow-gentle backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush text-rosewood">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm text-dusk">最近 7 天</p>
                <h3 className="text-xl font-semibold">{weekCount} 次记录</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-dusk">
              这一块先保留轻量回看。等 ChatSession 和结构化字段稳定后，再生成周总结和情绪标签线索。
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
