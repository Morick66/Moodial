import type { DiaryEntry, EntryDetail, EntryListItem, EntryWriteInput, EmotionModeId } from "@jzmle/core";
import { emotionModes } from "@jzmle/core";

export async function fetchEntries(params: { mode?: EmotionModeId | "all"; search?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.mode && params.mode !== "all") searchParams.set("mode", params.mode);

  const response = await fetch(`/api/entries${searchParams.size ? `?${searchParams.toString()}` : ""}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("无法读取日记列表");

  return (await response.json()) as EntryListItem[];
}

export async function fetchEntry(id: string) {
  const response = await fetch(`/api/entries/${id}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("无法读取日记");

  return (await response.json()) as EntryDetail;
}

export async function createEntry(input: EntryWriteInput) {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await readError(response, "保存日记失败"));

  return (await response.json()) as EntryDetail;
}

export async function updateEntry(id: string, input: Partial<EntryWriteInput>) {
  const response = await fetch(`/api/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await readError(response, "更新日记失败"));

  return (await response.json()) as EntryDetail;
}

export async function deleteEntry(id: string) {
  const response = await fetch(`/api/entries/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error(await readError(response, "删除日记失败"));
}

export async function migrateLocalEntriesToApi(entries: DiaryEntry[]) {
  const importedIds: string[] = [];

  for (const entry of entries.filter((item) => !item.id.startsWith("seed-"))) {
    const mode = entry.mode;
    await createEntry({
      mode,
      title: entry.title,
      diaryText: entry.diaryText,
      summary: entry.summary,
      tags: entry.tags,
      structured: {
        tags: entry.tags,
        emotions: [emotionModes.find((item) => item.id === mode)?.label ?? entry.modeLabel]
      },
      rawConversation: []
    });
    importedIds.push(entry.id);
  }

  return importedIds;
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
