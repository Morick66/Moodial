import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { emotionModes, type SafetyFlag } from "@jzmle/core";
import { generateDiaryDraft, type AiDiaryDraft } from "@/lib/server/ai-adapter";
import { createDraft } from "@/lib/diary-prototype";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { buildSessionState, getSessionCompanionMode, toChatMessage, toChatSessionDetail } from "@/lib/server/chat-session-mapper";
import { createStructured } from "@/lib/server/entry-mapper";
import { parseEmotionMode } from "@/lib/server/entry-mapper";
import { getUserPreferences } from "@/lib/server/user-preferences";

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
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
  if (!existing) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  if (existing.status === "saved") return NextResponse.json({ error: "这次记录已经保存为日记" }, { status: 409 });

  const mode = parseEmotionMode(existing.mode.toLowerCase());
  if (!mode) return NextResponse.json({ error: "会话模式异常" }, { status: 500 });

  const messages = existing.messages.map(toChatMessage);
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");

  if (!userText.trim()) return NextResponse.json({ error: "先说几句，再帮你整理" }, { status: 400 });

  const preferences = await getUserPreferences(account.id);
  const companionMode = getSessionCompanionMode(existing);
  const generated = await generateDiaryDraft({ aiDisplayName: preferences.aiDisplayName, messages, mode }).catch((cause) => {
    const message = cause instanceof Error ? cause.message : "AI 配置有问题或连接失败，请到设置中检查并测试 AI 配置。";
    const fallbackDraft = createFallbackDraft(mode, userText);
    return {
      draft: fallbackDraft,
      error: message,
      source: "fallback" as const
    };
  });

  const draft: AiDiaryDraft = generated.draft;
  const userTurns = messages.filter((message) => message.role === "user").length;
  const source = generated.source;
  const modeDefinition = emotionModes.find((item) => item.id === mode);
  const storedStructured = readStructured(existing.stateJson);
  const safetyFlag = readSafetyFlag(storedStructured?.safetyFlag);
  const structured = draft.structured
    ? createStructured({
        mode,
        title: draft.title,
        diaryText: draft.diaryText,
        summary: draft.summary,
        tags: draft.tags,
        structured: {
          ...draft.structured,
          ...(safetyFlag ? { safetyFlag } : {})
        },
        rawConversation: messages
      })
    : createStructured({
      mode,
      title: draft.title,
      diaryText: draft.diaryText,
      summary: draft.summary,
      tags: draft.tags,
      structured: {
        tags: draft.tags,
        emotions: [modeDefinition?.label ?? mode],
        ...(safetyFlag ? { safetyFlag } : {})
      },
      rawConversation: messages
    });
  const session = await prisma.chatSession.update({
    where: { id: existing.id },
    data: {
      status: "summarized",
      stateJson: buildSessionState({ companionMode, draft, shouldSummarize: true, source, structured, userTurns })
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return NextResponse.json({
    draft,
    source,
    ...(source === "fallback"
      ? {
          notice: "今天的内容已经先整理成可保存草稿。AI 配置可用后，可以再用模型精修。"
        }
      : {}),
    session: toChatSessionDetail(session)
  });
}

function readStructured(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const structured = (value as { structured?: unknown }).structured;
  if (!structured || typeof structured !== "object") return null;
  return structured as { safetyFlag?: unknown };
}

function readSafetyFlag(value: unknown): SafetyFlag | null {
  if (
    value === "self_harm" ||
    value === "harm_others" ||
    value === "medical_advice" ||
    value === "diagnosis_request" ||
    value === "violent_retaliation" ||
    value === "privacy_sensitive"
  ) {
    return value;
  }

  return null;
}

function createFallbackDraft(mode: NonNullable<ReturnType<typeof parseEmotionMode>>, userText: string): AiDiaryDraft {
  const draft = createDraft(mode, userText);
  const tags = Array.from(new Set([...draft.tags, "未 AI 精修"])).slice(0, 12);

  return {
    ...draft,
    summary: `${draft.summary} 这是一版未 AI 精修的临时整理。`,
    tags,
    structured: {
      emotions: [emotionModes.find((item) => item.id === mode)?.label ?? mode],
      tags
    }
  };
}
