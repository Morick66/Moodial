import type { ChatMessage, ChatSessionDetail, EntryDetail, EmotionModeId } from "@jzmle/core";
import type { CompanionMode } from "@/lib/record-prefill";

export async function createChatSession(mode: EmotionModeId, companionMode?: CompanionMode) {
  const response = await fetch("/api/chat-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companionMode, mode })
  });
  if (!response.ok) throw new Error(await readError(response, "无法开始记录"));

  return (await response.json()) as ChatSessionDetail;
}

export async function fetchChatSession(id: string) {
  const response = await fetch(`/api/chat-sessions/${id}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error(await readError(response, "无法读取会话"));

  return (await response.json()) as ChatSessionDetail;
}

export async function sendChatMessage(id: string, content: string) {
  const response = await fetch(`/api/chat-sessions/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!response.ok) throw new Error(await readError(response, "发送失败"));

  return (await response.json()) as {
    assistantMessage: ChatMessage;
    session: ChatSessionDetail;
    userMessage: ChatMessage;
  };
}

export async function streamChatMessage(
  id: string,
  content: string,
  onDelta: (delta: string) => void
) {
  const response = await fetch(`/api/chat-sessions/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, stream: true })
  });
  if (!response.ok) throw new Error(await readError(response, "发送失败"));
  if (!response.body) throw new Error("AI 响应为空");

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as ChatStreamEvent;

      if (event.type === "delta") {
        onDelta(event.delta);
        continue;
      }

      if (event.type === "done") {
        return event as {
          assistantMessage: ChatMessage;
          session: ChatSessionDetail;
          type: "done";
        };
      }

      if (event.type === "error") {
        throw new Error(event.error);
      }
    }
  }

  throw new Error("AI 响应中断，请稍后重试");
}

export async function appendUserChatMessage(id: string, content: string) {
  const response = await fetch(`/api/chat-sessions/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, respond: false })
  });
  if (!response.ok) throw new Error(await readError(response, "保存消息失败"));

  return (await response.json()) as {
    session: ChatSessionDetail;
    userMessage: ChatMessage;
  };
}

export async function summarizeChatSession(id: string) {
  const response = await fetch(`/api/chat-sessions/${id}/summarize`, {
    method: "POST"
  });
  if (!response.ok) throw new Error(await readError(response, "整理失败"));

  return (await response.json()) as Pick<ChatSessionDetail, "draft"> & {
    session: ChatSessionDetail;
  };
}

type ChatStreamEvent =
  | { delta: string; type: "delta" }
  | { error: string; type: "error" }
  | { assistantMessage: ChatMessage; session: ChatSessionDetail; type: "done" }
  | { type: "userMessage"; userMessage: ChatMessage };

export async function saveChatSessionEntry(id: string) {
  const response = await fetch(`/api/chat-sessions/${id}/entries`, {
    method: "POST"
  });
  if (!response.ok) throw new Error(await readError(response, "保存日记失败"));

  return (await response.json()) as EntryDetail;
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
