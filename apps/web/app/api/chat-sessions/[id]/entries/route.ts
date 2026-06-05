import { NextResponse } from "next/server";
import { emotionModes } from "@jzmle/core";
import { createDraft } from "@/lib/diary-prototype";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { toChatMessage } from "@/lib/server/chat-session-mapper";
import { createStructured, parseEmotionMode, toDetail, toPrismaJson } from "@/lib/server/entry-mapper";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await context.params;
  const existing = await prisma.chatSession.findFirst({
    where: { id, userId: account.id },
    include: {
      diaryEntry: true,
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
  if (!existing) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  if (existing.diaryEntry && !existing.diaryEntry.deletedAt) return NextResponse.json(toDetail(existing.diaryEntry));
  if (existing.diaryEntry?.deletedAt) return NextResponse.json({ error: "这次记录关联的日记已经删除" }, { status: 409 });

  const mode = parseEmotionMode(existing.mode.toLowerCase());
  if (!mode) return NextResponse.json({ error: "会话模式异常" }, { status: 500 });

  const messages = existing.messages.map(toChatMessage);
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
  if (!userText.trim()) return NextResponse.json({ error: "先说几句，再保存日记" }, { status: 400 });

  const draft = readDraft(existing.stateJson) ?? createDraft(mode, userText);
  const modeDefinition = emotionModes.find((item) => item.id === mode);
  const storedStructured = readStructured(existing.stateJson);
  const structured = createStructured({
    mode,
    title: draft.title,
    diaryText: draft.diaryText,
    summary: draft.summary,
    tags: draft.tags,
    structured: storedStructured ?? {
      tags: draft.tags,
      emotions: [modeDefinition?.label ?? mode]
    },
    rawConversation: messages
  });

  const entry = await prisma.diaryEntry.create({
    data: {
      userId: account.id,
      date: new Date(),
      mode: existing.mode,
      title: draft.title,
      diaryText: draft.diaryText,
      oneSentenceSummary: draft.summary,
      structuredJson: toPrismaJson(structured),
      rawConversation: toPrismaJson(messages),
      sourceSessionId: existing.id
    }
  });

  await prisma.chatSession.update({
    where: { id: existing.id },
    data: { status: "saved" }
  });

  return NextResponse.json(toDetail(entry), { status: 201 });
}

function readStructured(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const structured = (value as { structured?: unknown }).structured;
  if (!structured || typeof structured !== "object") return null;
  return structured;
}

function readDraft(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const draft = (value as { draft?: unknown }).draft;
  if (!draft || typeof draft !== "object") return null;
  const record = draft as { diaryText?: unknown; summary?: unknown; tags?: unknown; title?: unknown };
  if (typeof record.diaryText !== "string" || typeof record.summary !== "string" || typeof record.title !== "string") return null;

  return {
    diaryText: record.diaryText,
    summary: record.summary,
    title: record.title,
    tags: Array.isArray(record.tags) ? record.tags.filter((item): item is string => typeof item === "string") : []
  };
}
