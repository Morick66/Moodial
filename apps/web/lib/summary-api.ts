export type WeekSummary = {
  dailyTrend: Array<{
    count: number;
    date: string;
    dominantMode: string | null;
    dominantModeLabel: string | null;
  }>;
  endDate: string;
  entryCount: number;
  modeCounts: Array<{
    count: number;
    label: string;
    mode: string;
  }>;
  rangeEntryCount: number;
  recordedDays: number;
  recentEntries: Array<{
    date: string;
    id: string;
    modeLabel: string;
    summary: string;
    title: string;
  }>;
  startDate: string;
  streakDays: number;
  tagCounts: Array<{
    count: number;
    tag: string;
  }>;
  topModes: Array<{
    count: number;
    label: string;
    mode: string;
  }>;
  topTags: Array<{
    count: number;
    tag: string;
  }>;
};

export async function fetchWeekSummary() {
  const response = await fetch("/api/summary/week", {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("无法读取周总结");

  return (await response.json()) as WeekSummary;
}
