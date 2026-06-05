import type { DiaryEntry } from "@jzmle/core";

export const DIARY_STORAGE_KEY = "jzmle_diary_entries";

export const seedEntries: DiaryEntry[] = [
  {
    id: "seed-1",
    title: "忙完之后的一点轻松",
    mode: "happy",
    modeLabel: "记点开心的",
    summary: "和朋友聊了一会儿，心里松下来一点。",
    time: "今天 22:18",
    tags: ["朋友陪伴", "轻松", "小快乐"],
    status: "已整理",
    diaryText: "今天忙完之后，和朋友聊了一会儿。事情本身不大，但心里有一点松下来的感觉。"
  },
  {
    id: "seed-2",
    title: "脑子有点乱",
    mode: "messy",
    modeLabel: "脑子很乱",
    summary: "把担心和已经发生的事分开后，事情没那么压着了。",
    time: "昨天 23:04",
    tags: ["担心", "事实", "安定"],
    status: "草稿",
    diaryText: "昨天晚上脑子有点乱。把已经发生的事和自己担心的事分开后，心里稍微稳了一些。"
  }
];

export function loadDiaryEntries() {
  if (typeof window === "undefined") return seedEntries;

  const stored = window.localStorage.getItem(DIARY_STORAGE_KEY);
  if (!stored) return seedEntries;

  try {
    const parsed = JSON.parse(stored) as DiaryEntry[];
    return mergeSeedEntries(parsed);
  } catch {
    window.localStorage.removeItem(DIARY_STORAGE_KEY);
    return seedEntries;
  }
}

export function saveDiaryEntries(entries: DiaryEntry[]) {
  if (typeof window === "undefined") return;
  const userEntries = entries.filter((entry) => !entry.id.startsWith("seed-"));
  window.localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(userEntries));
}

export function loadStoredUserEntries() {
  if (typeof window === "undefined") return [];

  const stored = window.localStorage.getItem(DIARY_STORAGE_KEY);
  if (!stored) return [];

  try {
    return (JSON.parse(stored) as DiaryEntry[]).filter((entry) => !entry.id.startsWith("seed-"));
  } catch {
    window.localStorage.removeItem(DIARY_STORAGE_KEY);
    return [];
  }
}

export function clearStoredUserEntries() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DIARY_STORAGE_KEY);
}

export function formatTime(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function mergeSeedEntries(entries: DiaryEntry[]) {
  const existingIds = new Set(entries.map((entry) => entry.id));
  return [...entries, ...seedEntries.filter((entry) => !existingIds.has(entry.id))];
}
