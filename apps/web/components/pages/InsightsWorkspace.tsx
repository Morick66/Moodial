"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Sparkles, Tags } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchWeekSummary, type WeekSummary } from "@/lib/summary-api";

export function InsightsWorkspace() {
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWeekSummary()
      .then((nextSummary) => {
        if (!cancelled) setSummary(nextSummary);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl">
        <div className="moodial-glass rounded-[1.8rem] p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1 text-sm font-semibold text-[#875cff] shadow-button">
            <Sparkles size={16} /> 回顾与洞察
          </p>
          <h1 className="mt-4 text-4xl font-black text-[#11163d]">这周，Moodial 帮你收好这些线索</h1>
          <p className="mt-3 text-sm leading-7 text-[#777299]">先从记录频率、主要入口和常见标签开始。后续可以继续接入更完整的月总结和 AI 复盘。</p>
        </div>

        {loading ? <p className="mt-5 rounded-[1.5rem] bg-white/60 p-8 text-sm text-[#777299]">正在整理这一周...</p> : null}

        {summary ? (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <InsightStat icon={<BookOpen size={20} />} label="本周记录" value={`${summary.entryCount} 篇`} />
              <InsightStat icon={<CalendarDays size={20} />} label="记录天数" value={`${summary.recordedDays} 天`} />
              <InsightStat icon={<Sparkles size={20} />} label="连续记录" value={`${summary.streakDays} 天`} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <section className="moodial-glass rounded-[1.6rem] p-5">
                <h2 className="text-xl font-bold text-[#11163d]">主要情绪入口</h2>
                <div className="mt-4 grid gap-3">
                  {(summary.topModes.length ? summary.topModes : [{ count: 0, label: "暂无记录", mode: "empty" }]).map((mode) => (
                    <ProgressRow count={mode.count} key={mode.mode} label={mode.label} max={Math.max(1, ...summary.topModes.map((item) => item.count))} />
                  ))}
                </div>
              </section>

              <section className="moodial-glass rounded-[1.6rem] p-5">
                <h2 className="text-xl font-bold text-[#11163d]">常见标签</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.topTags.length ? (
                    summary.topTags.map((tag) => (
                      <span className="rounded-full bg-white/70 px-3 py-2 text-sm text-[#6f61a0] shadow-button" key={tag.tag}>
                        <Tags className="mr-1 inline" size={14} /> {tag.tag} · {tag.count}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[#81799d]">还没有标签。保存几篇日记后，这里会出现常见线索。</p>
                  )}
                </div>
              </section>
            </div>

            <section className="moodial-soft-panel mt-5 rounded-[1.6rem] p-5 shadow-gentle">
              <h2 className="text-xl font-bold text-[#11163d]">最近 5 篇</h2>
              <div className="mt-4 grid gap-3">
                {summary.recentEntries.length ? (
                  summary.recentEntries.map((entry) => (
                    <Link className="flex items-center justify-between gap-4 rounded-2xl bg-white/62 px-4 py-3 shadow-button" href={`/entries/${entry.id}`} key={entry.id}>
                      <span>
                        <span className="block font-semibold text-[#11163d]">{entry.title}</span>
                        <span className="mt-1 line-clamp-1 block text-sm text-[#777299]">{entry.date} / {entry.modeLabel} / {entry.summary}</span>
                      </span>
                      <ArrowRight className="shrink-0 text-[#875cff]" size={18} />
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white/58 p-5 text-sm text-[#777299]">这周还没有记录。先从今天的一句话开始也很好。</p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}

function InsightStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="moodial-glass rounded-[1.4rem] p-5">
      <div className="text-[#875cff]">{icon}</div>
      <p className="mt-4 text-sm text-[#81799d]">{label}</p>
      <p className="mt-1 text-3xl font-black text-[#11163d]">{value}</p>
    </div>
  );
}

function ProgressRow({ count, label, max }: { count: number; label: string; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-[#272a51]">{label}</span>
        <span className="text-[#81799d]">{count}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/62">
        <div className="h-full rounded-full bg-gradient-to-r from-[#875cff] to-[#ff91c0]" style={{ width: `${Math.round((count / max) * 100)}%` }} />
      </div>
    </div>
  );
}
