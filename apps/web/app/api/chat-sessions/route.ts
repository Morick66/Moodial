import { NextResponse } from "next/server";
import { getOpeningPrompt } from "@jzmle/prompts";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { buildSessionState, toChatSessionDetail } from "@/lib/server/chat-session-mapper";
import { parseEmotionMode, toPrismaMode } from "@/lib/server/entry-mapper";
import { companionModes, normalizeCompanionMode } from "@/lib/record-prefill";

export async function POST(request: Request) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const mode = parseEmotionMode(body?.mode);
  if (!mode) return NextResponse.json({ error: "请选择有效的情绪模式" }, { status: 400 });
  const companionMode = normalizeCompanionMode(body?.companionMode);
  const companion = companionMode ? companionModes[companionMode] : null;
  const openingPrompt = companion ? `${getOpeningPrompt(mode)}\n\n这次陪伴方式：${companion.title}。${companion.promptHint}` : getOpeningPrompt(mode);

  const session = await prisma.chatSession.create({
    data: {
      userId: account.id,
      mode: toPrismaMode(mode),
      status: "active",
      stateJson: buildSessionState({ companionMode, userTurns: 0 }),
      messages: {
        create: {
          role: "assistant",
          content: openingPrompt
        }
      }
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return NextResponse.json(toChatSessionDetail(session), { status: 201 });
}
