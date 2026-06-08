import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { emotionModes } from "@jzmle/core";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { toDetail } from "@/lib/server/entry-mapper";

export async function GET() {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const rangeStart = new Date(end);
  rangeStart.setDate(end.getDate() - 29);
  rangeStart.setHours(0, 0, 0, 0);

  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId: account.id,
      deletedAt: null,
      date: {
        gte: start,
        lte: end
      }
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });
  const rangeEntries = await prisma.diaryEntry.findMany({
    where: {
      userId: account.id,
      deletedAt: null,
      date: {
        gte: rangeStart,
        lte: end
      }
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }]
  });

  const details = entries.map(toDetail);
  const rangeDetails = rangeEntries.map(toDetail);
  const days = new Set(details.map((entry) => entry.date));
  const modeCounts = new Map<string, { count: number; label: string; mode: string }>();
  const tagCounts = new Map<string, number>();

  for (const entry of rangeDetails) {
    const modeDefinition = emotionModes.find((mode) => mode.id === entry.mode);
    const mode = modeCounts.get(entry.mode) ?? { count: 0, label: modeDefinition?.label ?? entry.modeLabel, mode: entry.mode };
    mode.count += 1;
    modeCounts.set(entry.mode, mode);

    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const dailyTrend = buildDailyTrend(rangeStart, end, rangeDetails);
  const sortedModeCounts = Array.from(modeCounts.values()).sort((first, second) => second.count - first.count);
  const sortedTagCounts = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ count, tag }))
    .sort((first, second) => second.count - first.count || first.tag.localeCompare(second.tag, "zh-CN"));

  return NextResponse.json({
    dailyTrend,
    endDate: toDateKey(end),
    entryCount: details.length,
    modeCounts: sortedModeCounts,
    rangeEntryCount: rangeDetails.length,
    recordedDays: days.size,
    recentEntries: details.slice(0, 5).map((entry) => ({
      id: entry.id,
      date: entry.date,
      modeLabel: entry.modeLabel,
      summary: entry.summary,
      title: entry.title
    })),
    startDate: toDateKey(start),
    streakDays: calculateStreak(rangeDetails, end),
    tagCounts: sortedTagCounts,
    topModes: sortedModeCounts,
    topTags: sortedTagCounts.slice(0, 8)
  });
}

function buildDailyTrend(start: Date, end: Date, entries: ReturnType<typeof toDetail>[]) {
  const byDate = new Map<string, typeof entries>();
  for (const entry of entries) {
    byDate.set(entry.date, [...(byDate.get(entry.date) ?? []), entry]);
  }

  const trend = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = toDateKey(cursor);
    const dayEntries = byDate.get(date) ?? [];
    const modeCounts = new Map<string, { count: number; label: string; mode: string }>();
    for (const entry of dayEntries) {
      const current = modeCounts.get(entry.mode) ?? { count: 0, label: entry.modeLabel, mode: entry.mode };
      current.count += 1;
      modeCounts.set(entry.mode, current);
    }
    const dominant = Array.from(modeCounts.values()).sort((first, second) => second.count - first.count)[0];
    trend.push({
      count: dayEntries.length,
      date,
      dominantMode: dominant?.mode ?? null,
      dominantModeLabel: dominant?.label ?? null
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return trend;
}

function calculateStreak(entries: ReturnType<typeof toDetail>[], end: Date) {
  const recorded = new Set(entries.map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date(end);
  while (recorded.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
