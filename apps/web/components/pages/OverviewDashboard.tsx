"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { EntryListItem, EmotionModeId } from "@jzmle/core";
import { ArrowRight, CalendarDays, Mic, PenLine, Send, Sparkles, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryCard } from "@/components/diary/EntryCard";
import { fetchEntries } from "@/lib/entry-api";
import { fetchHomeGreeting, type HomeGreeting } from "@/lib/home-greeting-api";
import { companionModes, writeRecordPrefill, type CompanionMode } from "@/lib/record-prefill";
import { fetchWeekSummary, type WeekSummary } from "@/lib/summary-api";

const moodStates = [
  { label: "平静", emoji: "😌", mode: "messy" as const, tone: "from-[#e9f3ff] to-[#dceaff]" },
  { label: "开心", emoji: "🙂", mode: "happy" as const, tone: "from-[#fff2cf] to-[#ffe2a8]" },
  { label: "烦躁", emoji: "😡", mode: "angry" as const, tone: "from-[#ffe1d9] to-[#ffb29a]" },
  { label: "难过", emoji: "☹️", mode: "sad" as const, tone: "from-[#eadcff] to-[#ccb0ff]" },
  { label: "空白", emoji: "😐", mode: "messy" as const, tone: "from-[#f0f1f6] to-[#dfe2ea]" },
  { label: "想发泄", emoji: "😖", mode: "angry" as const, tone: "from-[#ffe6ee] to-[#ffc8dc]" }
];

const companionCards = [
  { accent: "text-[#7b4dff]", art: "💗", mode: "gentle" as const },
  { accent: "text-[#326ddf]", art: "🧊", mode: "rational" as const },
  { accent: "text-[#c46b2d]", art: "🙂", mode: "friend" as const },
  { accent: "text-[#ed4f79]", art: "🧶", mode: "vent" as const },
  { accent: "text-[#5d50c7]", art: "🧩", mode: "review" as const }
];

export function OverviewDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [greeting, setGreeting] = useState<HomeGreeting>({
    body: "不用写完整，也不用解释清楚。先选一个感觉，聊几句，系统会帮你把今天整理成可以回看的日记。",
    title: "今天你想怎么被接住？"
  });
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [quickText, setQuickText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [nextEntries, nextSummary, nextGreeting] = await Promise.all([
          fetchEntries(),
          fetchWeekSummary(),
          fetchHomeGreeting().catch(() => null)
        ]);
        if (!cancelled) setEntries(nextEntries);
        if (!cancelled) setWeekSummary(nextSummary);
        if (!cancelled && nextGreeting) setGreeting(nextGreeting);
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
  const weekCount = weekSummary?.entryCount ?? entries.slice(0, 7).length;

  function startRecord(input: { companionMode?: CompanionMode; mode?: EmotionModeId; text?: string } = {}) {
    const nextMode = input.mode ?? "messy";
    const nextCompanionMode = input.companionMode ?? "gentle";
    writeRecordPrefill({
      companionMode: nextCompanionMode,
      mode: nextMode,
      text: input.text ?? quickText
    });
    router.push(`/record?mode=${nextMode}&companion=${nextCompanionMode}`);
  }

  function startVoicePlaceholder() {
    window.alert("语音输入会在后续版本接入转写。现在可以先用文字随便说说。");
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <section className="px-2 pb-4 pt-1 sm:px-4">
            <h1 className="text-4xl font-black leading-tight tracking-[0.01em] text-[#11163d] sm:text-5xl">
              {greeting.title || "今天，想怎么记录自己？"} <span className="text-[#f2c447]">✧</span>
            </h1>
            <p className="mt-4 text-lg text-[#777299]">{greeting.body || "每一种情绪，都值得被温柔对待。"}</p>
          </section>

          <section className="moodial-glass rounded-[1.7rem] p-5 sm:p-6">
            <h2 className="text-xl font-bold text-[#11163d]">现在的你更接近哪种状态？</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {moodStates.map((state) => (
                <button
                  className={`relative flex min-h-28 flex-col items-center justify-center rounded-[1.4rem] bg-gradient-to-br ${state.tone} p-3 text-center shadow-button transition hover:-translate-y-1 hover:ring-2 hover:ring-[#875cff]/35 hover:ring-offset-2 hover:ring-offset-white`}
                  key={state.label}
                  onClick={() => startRecord({ mode: state.mode })}
                  type="button"
                >
                  <span className="text-4xl">{state.emoji}</span>
                  <span className="mt-3 text-sm font-semibold text-[#1c214b]">{state.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="moodial-glass relative mt-5 overflow-hidden rounded-[1.7rem] p-5 sm:p-6">
            <div className="absolute right-6 top-6 text-[#bba5ff]">
              <Send size={42} strokeWidth={1.4} />
            </div>
            <p className="inline-flex items-center gap-2 text-2xl font-semibold text-[#8157ff]">
              <Sparkles size={22} /> 写一点也可以。
            </p>
            <div className="mt-4 rounded-[1.4rem] border border-[#e6dcff] bg-white/62 p-4 shadow-inner">
              <textarea
                className="min-h-32 w-full resize-none bg-transparent text-base leading-7 text-[#272a51] outline-none placeholder:text-[#aaa4bd]"
                onChange={(event) => setQuickText(event.target.value)}
                placeholder="今天发生了什么？"
                value={quickText}
              />
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-full bg-[#f5eaff] px-5 text-sm font-semibold text-[#8157ff] shadow-button" onClick={startVoicePlaceholder} type="button">
                  <Mic size={18} />
                  语音输入
                </button>
                <button className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-full bg-[#edf3ff] px-5 text-sm font-semibold text-[#4d78d8] shadow-button" onClick={() => startRecord({ companionMode: "friend" })} type="button">
                  <PenLine size={18} />
                  随便说说
                </button>
                <button className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-full bg-[#fff0f6] px-5 text-sm font-semibold text-[#ef5e91] shadow-button" onClick={() => startRecord({ companionMode: "gentle" })} type="button">
                  <WandSparkles size={18} />
                  AI 引导我
                </button>
              </div>
            </div>
          </section>

          <section className="moodial-glass mt-5 rounded-[1.7rem] p-5 sm:p-6">
            <h2 className="text-xl font-bold text-[#11163d]">今天想让 Moodial 怎么陪你？</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {companionCards.map((card, index) => (
                <button
                  className="min-h-32 rounded-[1.2rem] border border-white/75 bg-white/58 p-4 shadow-button transition hover:-translate-y-1 hover:border-[#8b61ff] hover:bg-gradient-to-br hover:from-white hover:to-[#f2eaff]"
                  key={card.mode}
                  onClick={() => startRecord({ companionMode: card.mode })}
                  type="button"
                >
                  <h3 className={`font-bold ${card.accent}`}>{companionModes[card.mode].title}</h3>
                  <p className="mt-1 text-sm text-[#827b9d]">{companionModes[card.mode].body}</p>
                  <p className="mt-4 text-4xl">{card.art}</p>
                </button>
              ))}
            </div>
            <button className="moodial-button mx-auto mt-5 flex h-14 max-w-xl items-center justify-center gap-3 rounded-full text-lg font-semibold text-white" onClick={() => startRecord()} type="button">
              和 Moodial 说说
              <ArrowRight size={20} />
            </button>
            <p className="mt-3 text-center text-xs text-[#8a83a4]">你的内容只属于你，Moodial 会陪你整理，而不是评价你。</p>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="moodial-soft-panel rounded-[1.7rem] p-5 shadow-gentle">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-bold text-[#1b2048]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eee4ff] text-[#8a61ff]">♪</span>
                Moodial 正在理解你的感受...
              </p>
              <span className="text-3xl text-[#ad88ff]">▮▮▮▮</span>
            </div>
            <div className="mt-6 grid grid-cols-[110px_1fr] gap-4">
              <div className="flex items-center justify-center">
                <span className="moodial-mascot" aria-hidden="true" />
              </div>
              <div className="rounded-[1.35rem] bg-white/78 p-5 text-lg font-semibold leading-8 text-[#20254f] shadow-button">
                听起来你今天有些烦躁，可能是发生了让你感到不舒服的事情吧？想和我多说一点吗？
                <span className="ml-3 text-[#ff8cc0]">♥</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {["我被人误解了", "今天压力好大", "有点累了", "不知道为什么生气"].map((text) => (
                <button className="rounded-full border border-[#ddd2ff] bg-white/58 px-4 py-2 text-sm font-medium text-[#6e61bd] shadow-button" key={text} onClick={() => startRecord({ text })} type="button">
                  {text}
                </button>
              ))}
            </div>
          </section>

          <section className="moodial-glass rounded-[1.7rem] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#11163d]">今日情绪轨迹</h2>
              <Link className="inline-flex items-center gap-1 text-sm text-[#837aa1]" href="/calendar">
                查看日历 <CalendarDays size={16} />
              </Link>
            </div>
            <EmotionTrail trend={weekSummary?.dailyTrend ?? []} />
            <div className="mt-4 rounded-[1.2rem] bg-gradient-to-r from-[#f4eaff] to-[#ffe9df] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#875cff]">
                <Sparkles size={16} /> AI 小结
              </p>
              <p className="mt-2 text-sm leading-6 text-[#4d4771]">
                {weekCount > 0
                  ? `你最近留下了 ${weekCount} 次记录。傍晚的情绪有好转，说明你正在慢慢调整自己。`
                  : "今天还没有新的记录。先写一句也很好，Moodial 会帮你慢慢整理。"}
              </p>
            </div>
          </section>

          <section className="moodial-glass rounded-[1.7rem] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#11163d]">最近一页</h2>
              <Link className="text-sm text-[#875cff]" href="/entries">
                全部日记
              </Link>
            </div>
            {loading ? (
              <p className="rounded-[1.2rem] bg-white/60 p-6 text-sm text-[#777299]">正在翻开日记本...</p>
            ) : latestEntry ? (
              <EntryCard entry={latestEntry} />
            ) : (
              <p className="rounded-[1.2rem] border border-dashed border-[#cbbcff] bg-white/52 p-6 text-sm leading-7 text-[#777299]">还没有日记。今晚可以从一句“今天有点乱”开始。</p>
            )}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function EmotionTrail({ trend }: { trend: WeekSummary["dailyTrend"] }) {
  const recent = trend.slice(-7);
  const maxCount = Math.max(1, ...recent.map((item) => item.count));
  const points = recent
    .map((item, index) => {
      const x = 22 + index * (336 / Math.max(1, recent.length - 1));
      const y = 112 - (item.count / maxCount) * 76;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-4 rounded-[1.25rem] bg-white/55 p-4">
      {recent.some((item) => item.count > 0) ? (
      <svg aria-label="最近 7 天记录趋势" className="h-40 w-full" role="img" viewBox="0 0 380 150">
        <defs>
          <linearGradient id="trailGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#8a62ff" />
            <stop offset="55%" stopColor="#ea74c4" />
            <stop offset="100%" stopColor="#ff8f9e" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line key={line} stroke="#eee8f8" strokeDasharray="4 5" x1="22" x2="360" y1={30 + line * 28} y2={30 + line * 28} />
        ))}
        <polyline fill="none" points={points} stroke="url(#trailGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        {recent.map((item, index) => {
          const x = 22 + index * (336 / Math.max(1, recent.length - 1));
          const y = 112 - (item.count / maxCount) * 76;
          return <circle cx={x} cy={y} fill="#fff" key={item.date} r="7" stroke={item.count > 0 ? "#ea74c4" : "#d8d1e8"} strokeWidth="4" />;
        })}
        {recent.map((item, index) => (
          <text fill="#81799d" fontSize="11" key={`label-${item.date}`} textAnchor="middle" x={22 + index * (336 / Math.max(1, recent.length - 1))} y="138">
            {item.date.slice(5)}
          </text>
        ))}
      </svg>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[#d8ccff] text-sm text-[#81799d]">
          最近还没有足够记录，写下一篇后这里会出现真实轨迹。
        </div>
      )}
    </div>
  );
}
