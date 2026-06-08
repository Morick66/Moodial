import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { generateAssistantReply, streamAssistantReply } from "@/lib/server/ai-adapter";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { buildSessionState, getSessionCompanionMode, shouldSuggestSummarize, toChatMessage, toChatSessionDetail } from "@/lib/server/chat-session-mapper";
import { parseEmotionMode } from "@/lib/server/entry-mapper";
import { classifySafety } from "@/lib/server/safety";
import { getUserPreferences } from "@/lib/server/user-preferences";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const shouldRespond = body?.respond !== false;
  const shouldStream = body?.stream === true;
  if (!content) return NextResponse.json({ error: "消息不能为空" }, { status: 400 });

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

  const previousMessages = existing.messages.map(toChatMessage);
  const companionMode = getSessionCompanionMode(existing);
  const pendingUserMessage = {
    id: "pending-user-message",
    role: "user" as const,
    content
  };
  const nextMessages = [...previousMessages, pendingUserMessage];
  const safety = classifySafety(content, mode);

  if (safety) {
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: existing.id,
        role: "user",
        content
      }
    });
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: existing.id,
        role: "assistant",
        content: safety.response,
        metadataJson: { safetyFlag: safety.flag, source: "fallback", sourceNote: "安全边界回应" }
      }
    });
    const userTurns = nextMessages.filter((message) => message.role === "user").length;
    await prisma.chatSession.update({
      where: { id: existing.id },
      data: {
        status: "ready_to_summarize",
        stateJson: buildSessionState({
          companionMode,
          shouldSummarize: true,
          source: "fallback",
          structured: { safetyFlag: safety.flag },
          userTurns
        })
      }
    });

    const session = await prisma.chatSession.findUniqueOrThrow({
      where: { id: existing.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    const payload = {
      assistantMessage: toChatMessage(assistantMessage),
      session: toChatSessionDetail(session),
      source: "fallback" as const,
      userMessage: toChatMessage(userMessage)
    };

    if (shouldStream) {
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "userMessage", userMessage: payload.userMessage })}\n`));
            controller.enqueue(encoder.encode(`${JSON.stringify({ assistantMessage: payload.assistantMessage, session: payload.session, type: "done" })}\n`));
            controller.close();
          }
        }),
        {
          headers: {
            "Cache-Control": "no-cache, no-transform",
            "Content-Type": "application/x-ndjson; charset=utf-8"
          }
        }
      );
    }

    return NextResponse.json(payload);
  }

  if (!shouldRespond) {
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: existing.id,
        role: "user",
        content
      }
    });

    const userTurns = nextMessages.filter((message) => message.role === "user").length;
    await prisma.chatSession.update({
      where: { id: existing.id },
      data: {
        status: "ready_to_summarize",
        stateJson: buildSessionState({ companionMode, shouldSummarize: true, source: "ai", userTurns })
      }
    });

    const session = await prisma.chatSession.findUniqueOrThrow({
      where: { id: existing.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return NextResponse.json({
      session: toChatSessionDetail(session),
      userMessage: toChatMessage(userMessage)
    });
  }

  if (shouldStream) {
    const preferences = await getUserPreferences(account.id);
    return streamChatMessageResponse({
      aiDisplayName: preferences.aiDisplayName,
      companionMode,
      content,
      existingId: existing.id,
      messages: nextMessages,
      mode
    });
  }

  const preferences = await getUserPreferences(account.id);
  const generated = await generateAssistantReply({ aiDisplayName: preferences.aiDisplayName, companionMode, messages: nextMessages, mode }).catch((cause) => {
    const message = cause instanceof Error ? cause.message : "AI 配置有问题或连接失败，请到设置中检查并测试 AI 配置。";
    return { error: message };
  });
  if ("error" in generated) {
    return NextResponse.json({ error: generated.error }, { status: 503 });
  }

  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId: existing.id,
      role: "user",
      content
    }
  });
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: existing.id,
      role: "assistant",
      content: generated.content,
      metadataJson: { source: generated.source }
    }
  });

  const userTurns = nextMessages.filter((message) => message.role === "user").length;
  const shouldSummarize = shouldSuggestSummarize(content, userTurns);
  await prisma.chatSession.update({
    where: { id: existing.id },
    data: {
      status: shouldSummarize ? "ready_to_summarize" : "active",
      stateJson: buildSessionState({ companionMode, shouldSummarize, source: generated.source, userTurns })
    }
  });

  const session = await prisma.chatSession.findUniqueOrThrow({
    where: { id: existing.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return NextResponse.json({
    session: toChatSessionDetail(session),
    source: generated.source,
    userMessage: toChatMessage(userMessage),
    assistantMessage: toChatMessage(assistantMessage)
  });
}

function streamChatMessageResponse({
  aiDisplayName,
  companionMode,
  content,
  existingId,
  messages,
  mode
}: {
  aiDisplayName: string;
  companionMode?: ReturnType<typeof getSessionCompanionMode>;
  content: string;
  existingId: string;
  messages: ReturnType<typeof toChatMessage>[];
  mode: NonNullable<ReturnType<typeof parseEmotionMode>>;
}) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const sendEvent = (event: unknown) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        let assistantContent = "";

        try {
          const userMessage = await prisma.chatMessage.create({
            data: {
              sessionId: existingId,
              role: "user",
              content
            }
          });
          sendEvent({ type: "userMessage", userMessage: toChatMessage(userMessage) });

          const stream = await streamAssistantReply({ aiDisplayName, companionMode, messages, mode });
          for await (const delta of stream) {
            assistantContent += delta;
            sendEvent({ delta, type: "delta" });
          }

          const assistantMessage = await prisma.chatMessage.create({
            data: {
              sessionId: existingId,
              role: "assistant",
              content: assistantContent.trim(),
              metadataJson: { source: "ai" }
            }
          });

          const userTurns = messages.filter((message) => message.role === "user").length;
          const suggestSummarize = shouldSuggestSummarize(content, userTurns);
          await prisma.chatSession.update({
            where: { id: existingId },
            data: {
              status: suggestSummarize ? "ready_to_summarize" : "active",
              stateJson: buildSessionState({ companionMode, shouldSummarize: suggestSummarize, source: "ai", userTurns })
            }
          });

          const session = await prisma.chatSession.findUniqueOrThrow({
            where: { id: existingId },
            include: {
              messages: {
                orderBy: { createdAt: "asc" }
              }
            }
          });

          sendEvent({
            assistantMessage: toChatMessage(assistantMessage),
            session: toChatSessionDetail(session),
            type: "done"
          });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "AI 配置有问题或连接失败，请到设置中检查并测试 AI 配置。";
          sendEvent({ error: message, type: "error" });
        } finally {
          controller.close();
        }
      }
    }),
    {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "application/x-ndjson; charset=utf-8"
      }
    }
  );
}
