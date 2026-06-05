import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { generateDiaryDraft, type AiDiaryDraft } from "@/lib/server/ai-adapter";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { buildSessionState, toChatMessage, toChatSessionDetail } from "@/lib/server/chat-session-mapper";
import { parseEmotionMode } from "@/lib/server/entry-mapper";

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

  const generated = await generateDiaryDraft({ messages, mode }).catch((cause) => {
    const message = cause instanceof Error ? cause.message : "AI 配置有问题或连接失败，请到设置中检查并测试 AI 配置。";
    return { error: message };
  });
  if ("error" in generated) {
    return NextResponse.json({ error: generated.error }, { status: 503 });
  }

  const draft: AiDiaryDraft = generated.draft;
  const userTurns = messages.filter((message) => message.role === "user").length;
  const session = await prisma.chatSession.update({
    where: { id: existing.id },
    data: {
      status: "summarized",
      stateJson: buildSessionState({ draft, shouldSummarize: true, source: generated.source, structured: draft.structured, userTurns })
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return NextResponse.json({
    draft,
    source: generated.source,
    session: toChatSessionDetail(session)
  });
}
