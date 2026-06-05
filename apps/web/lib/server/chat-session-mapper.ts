import type { ChatMessage, ChatSessionDetail, ChatSessionStatus, DiaryStructuredData, DraftDiary, EmotionModeId } from "@jzmle/core";
import type { ChatMessage as PrismaChatMessage, ChatSession as PrismaChatSession, EmotionMode as PrismaEmotionMode, Prisma } from "@prisma/client";

const modeFromPrisma: Record<PrismaEmotionMode, EmotionModeId> = {
  HAPPY: "happy",
  ANGRY: "angry",
  SAD: "sad",
  MESSY: "messy"
};

export type ChatSessionWithMessages = PrismaChatSession & {
  messages: PrismaChatMessage[];
};

export function toChatSessionDetail(session: ChatSessionWithMessages): ChatSessionDetail {
  const state = normalizeState(session.stateJson);

  return {
    id: session.id,
    mode: modeFromPrisma[session.mode],
    status: normalizeStatus(session.status),
    messages: session.messages.map(toChatMessage),
    draft: state.draft,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString()
  };
}

export function toChatMessage(message: PrismaChatMessage): ChatMessage {
  const role = message.role === "user" || message.role === "system" ? message.role : "assistant";
  const metadata = normalizeMessageMetadata(message.metadataJson);

  return {
    id: message.id,
    role,
    content: message.content,
    source: metadata.source,
    sourceNote: metadata.sourceNote
  };
}

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function buildSessionState(input: { draft?: DraftDiary | null; source?: "ai" | "fallback"; structured?: Partial<DiaryStructuredData>; shouldSummarize?: boolean; userTurns: number }) {
  return toPrismaJson({
    draft: input.draft ?? null,
    source: input.source ?? "fallback",
    structured: input.structured ?? null,
    shouldSummarize: Boolean(input.shouldSummarize),
    userTurns: input.userTurns
  });
}

export function shouldSuggestSummarize(latestUserContent: string, userTurns: number) {
  return /^(没有了|没了|没啥了|不用了|就这样|就这样吧|可以了|结束吧|退出吧|保存|保存吧|存一下|存起来|记录下来|记下来|归档)$/i.test(latestUserContent.replace(/\s/g, "")) && userTurns > 0;
}

export function normalizeStatus(value: string): ChatSessionStatus {
  if (value === "ready_to_summarize" || value === "summarized" || value === "saved") return value;
  return "active";
}

function normalizeState(value: unknown): { draft: DraftDiary | null } {
  if (!value || typeof value !== "object") return { draft: null };
  const draft = (value as { draft?: unknown }).draft;

  if (!draft || typeof draft !== "object") return { draft: null };
  const record = draft as Partial<DraftDiary>;
  if (typeof record.diaryText !== "string" || typeof record.summary !== "string" || typeof record.title !== "string") return { draft: null };

  return {
    draft: {
      diaryText: record.diaryText,
      summary: record.summary,
      title: record.title,
      tags: Array.isArray(record.tags) ? record.tags.filter((item): item is string => typeof item === "string").slice(0, 12) : []
    }
  };
}

function normalizeMessageMetadata(value: unknown): { source?: "ai" | "fallback"; sourceNote?: string } {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const source = record.source === "ai" || record.source === "fallback" ? record.source : undefined;
  const sourceNote = typeof record.sourceNote === "string" ? record.sourceNote : undefined;

  return { source, sourceNote };
}
