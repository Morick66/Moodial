"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3, CalendarDays, Tags, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchWeekSummary, type WeekSummary } from "@/lib/summary-api";

const modeColors: Record<string, string> = {
  angry: "bg-[#ff8a78]",
  happy: "bg-[#ffd775]",
  messy: "bg-[#aa8cff]",
  sad: "bg-[#8ab5ff]"
};

export function AnalysisWorkspace() {
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
            <BarChart3 size={16} /> 情绪分析
          </p>
          <h1 className="mt-4 text-4xl font-black text-[#11163d]">用真实记录看见最近的变化</h1>
          <p className="mt-3 text-sm leading-7 text-[#777299]">这里只做记录维度的统计，不做诊断。数据来自最近 30 天的日记。</p>
        </div>

        {loading ? <p className="mt-5 rounded-[1.5rem] bg-white/60 p-8 text-sm text-[#777299]">正在读取分析数据...</p> : null}

        {summary ? (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Metric icon={<TrendingUp size={20} />} label="30 天记录" value={`${summary.rangeEntryCount} 篇`} />
              <Metric icon={<CalendarDays size={20} />} label="当前连续" value={`${summary.streakDays} 天`} />
              <Metric icon={<Tags size={20} />} label="标签数量" value={`${summary.tagCounts.length} 个`} />
            </div>

            <section className="moodial-glass mt-5 rounded-[1.6rem] p-5">
              <h2 className="text-xl font-bold text-[#11163d]">最近 30 天记录趋势</h2>
              <div className="mt-5 flex h-56 items-end gap-1 rounded-2xl bg-white/45 p-4">
                {summary.dailyTrend.map((day) => {
                  const max = Math.max(1, ...summary.dailyTrend.map((item) => item.count));
                  return (
                    <div className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" key={day.date} title={`${day.date}: ${day.count} 篇${day.dominantModeLabel ? ` / ${day.dominantModeLabel}` : ""}`}>
                      <div
                        className={`w-full rounded-t-lg ${day.dominantMode ? modeColors[day.dominantMode] ?? "bg-[#c9baff]" : "bg-[#e8e2f3]"}`}
                        style={{ height: `${Math.max(8, (day.count / max) * 168)}px`, opacity: day.count > 0 ? 0.95 : 0.45 }}
                      />
                      <span className="hidden text-[10px] text-[#81799d] sm:block">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <section className="moodial-glass rounded-[1.6rem] p-5">
                <h2 className="text-xl font-bold text-[#11163d]">入口分布</h2>
                <div className="mt-4 grid gap-3">
                  {summary.modeCounts.length ? (
                    summary.modeCounts.map((mode) => <DistributionRow count={mode.count} key={mode.mode} label={mode.label} max={Math.max(1, ...summary.modeCounts.map((item) => item.count))} />)
                  ) : (
                    <p className="text-sm text-[#81799d]">暂无记录。</p>
                  )}
                </div>
              </section>

              <section className="moodial-glass rounded-[1.6rem] p-5">
                <h2 className="text-xl font-bold text-[#11163d]">标签排行</h2>
                <div className="mt-4 grid gap-2">
                  {summary.tagCounts.slice(0, 10).length ? (
                    summary.tagCounts.slice(0, 10).map((tag) => (
                      <div className="flex items-center justify-between rounded-2xl bg-white/58 px-4 py-3 text-sm shadow-button" key={tag.tag}>
                        <span className="text-[#272a51]">{tag.tag}</span>
                        <span className="font-semibold text-[#875cff]">{tag.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#81799d]">保存带标签的日记后，这里会出现排行。</p>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="moodial-glass rounded-[1.4rem] p-5">
      <div className="text-[#875cff]">{icon}</div>
      <p className="mt-4 text-sm text-[#81799d]">{label}</p>
      <p className="mt-1 text-3xl font-black text-[#11163d]">{value}</p>
    </div>
  );
}

function DistributionRow({ count, label, max }: { count: number; label: string; max: number }) {
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
