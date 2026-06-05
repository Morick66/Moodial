import type { ChatMessage, DiaryStructuredData, EntryDetail, EntryListItem, EntryWriteInput, EmotionModeId } from "@jzmle/core";
import { emotionModes } from "@jzmle/core";
import type { DiaryEntry as PrismaDiaryEntry, EmotionMode as PrismaEmotionMode, Prisma } from "@prisma/client";

const modeToPrisma: Record<EmotionModeId, PrismaEmotionMode> = {
  happy: "HAPPY",
  angry: "ANGRY",
  sad: "SAD",
  messy: "MESSY"
};

const modeFromPrisma: Record<PrismaEmotionMode, EmotionModeId> = {
  HAPPY: "happy",
  ANGRY: "angry",
  SAD: "sad",
  MESSY: "messy"
};

export function parseEmotionMode(value: unknown) {
  if (value === "happy" || value === "angry" || value === "sad" || value === "messy") {
    return value;
  }

  return null;
}

export function toPrismaMode(mode: EmotionModeId) {
  return modeToPrisma[mode];
}

export function toListItem(entry: PrismaDiaryEntry): EntryListItem {
  const mode = modeFromPrisma[entry.mode];
  const modeDefinition = emotionModes.find((item) => item.id === mode);
  const structured = normalizeStructured(entry.structuredJson);

  return {
    id: entry.id,
    date: toDateKey(entry.date),
    mode,
    modeLabel: modeDefinition?.label ?? mode,
    title: entry.title ?? entry.oneSentenceSummary,
    summary: entry.oneSentenceSummary,
    tags: structured.tags,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  };
}

export function toDetail(entry: PrismaDiaryEntry): EntryDetail {
  return {
    ...toListItem(entry),
    diaryText: entry.diaryText,
    structured: normalizeStructured(entry.structuredJson),
    rawConversation: normalizeMessages(entry.rawConversation),
    userEdited: entry.userEdited,
    privacyLevel: entry.privacyLevel === "LOCKED" ? "locked" : "normal"
  };
}

export function createStructured(input: EntryWriteInput): DiaryStructuredData {
  return normalizeStructured({
    scenes: input.structured?.scenes ?? [],
    events: input.structured?.events ?? [],
    people: input.structured?.people ?? [],
    emotions: input.structured?.emotions ?? [],
    bodyState: input.structured?.bodyState ?? [],
    trigger: input.structured?.trigger ?? [],
    automaticThoughts: input.structured?.automaticThoughts ?? [],
    coreFeeling: input.structured?.coreFeeling ?? "",
    needs: input.structured?.needs ?? [],
    actions: input.structured?.actions ?? [],
    tags: input.tags ?? input.structured?.tags ?? [],
    safetyFlag: input.structured?.safetyFlag ?? "none"
  });
}

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function parseEntryInput(body: unknown, partial = false): { error: string; input?: never } | { error?: never; input: Partial<EntryWriteInput> } {
  if (!body || typeof body !== "object") return { error: "请求体格式不正确" };
  const record = body as Record<string, unknown>;
  const mode = parseEmotionMode(record.mode);
  const diaryText = typeof record.diaryText === "string" ? record.diaryText.trim() : "";
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  const title = typeof record.title === "string" ? record.title.trim() : undefined;
  const date = typeof record.date === "string" ? record.date : undefined;
  const tags = Array.isArray(record.tags) ? record.tags.filter((item): item is string => typeof item === "string").slice(0, 12) : undefined;
  const rawConversation = Array.isArray(record.rawConversation) ? normalizeMessages(record.rawConversation) : undefined;

  if (!partial && !mode) return { error: "请选择有效的情绪模式" };
  if (!partial && !diaryText) return { error: "日记正文不能为空" };
  if (!partial && !summary) return { error: "一句话总结不能为空" };
  if (record.mode !== undefined && !mode) return { error: "请选择有效的情绪模式" };
  if (record.diaryText !== undefined && !diaryText) return { error: "日记正文不能为空" };
  if (record.summary !== undefined && !summary) return { error: "一句话总结不能为空" };

  return {
    input: {
      ...(mode ? { mode } : {}),
      ...(date ? { date } : {}),
      ...(title ? { title } : {}),
      ...(diaryText ? { diaryText } : {}),
      ...(summary ? { summary } : {}),
      ...(tags ? { tags } : {}),
      ...(typeof record.structured === "object" && record.structured ? { structured: record.structured as EntryWriteInput["structured"] } : {}),
      ...(rawConversation ? { rawConversation } : {})
    }
  };
}

export function parseEntryDate(value: string | undefined) {
  if (!value) return new Date();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeStructured(value: unknown): DiaryStructuredData {
  const record = value && typeof value === "object" ? (value as Partial<DiaryStructuredData>) : {};

  return {
    scenes: normalizeStringArray(record.scenes),
    events: normalizeStringArray(record.events),
    people: normalizeStringArray(record.people),
    emotions: normalizeStringArray(record.emotions),
    bodyState: normalizeStringArray(record.bodyState),
    trigger: normalizeStringArray(record.trigger),
    automaticThoughts: normalizeStringArray(record.automaticThoughts),
    coreFeeling: typeof record.coreFeeling === "string" ? record.coreFeeling : "",
    needs: normalizeStringArray(record.needs),
    actions: normalizeStringArray(record.actions),
    tags: normalizeStringArray(record.tags),
    safetyFlag: record.safetyFlag ?? "none"
  };
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const record = item as Partial<ChatMessage>;
      return typeof record.id === "string" && typeof record.content === "string" && (record.role === "assistant" || record.role === "system" || record.role === "user");
    })
    .slice(0, 100);
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 20) : [];
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
