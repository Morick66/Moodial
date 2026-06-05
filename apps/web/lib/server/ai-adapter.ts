import type { ChatMessage, DiaryStructuredData, DraftDiary, EmotionModeId } from "@jzmle/core";
import { diaryOutputPrompt, followUpPrompt, modePrompts, commonSystemPrompt } from "@jzmle/prompts";
import { getAiSettingsPrivate } from "@/lib/server/ai-settings";

const AI_REPLY_TIMEOUT_MS = 60000;
const AI_DRAFT_TIMEOUT_MS = 120000;
const AI_REPLY_MAX_TOKENS = 160;
const AI_DRAFT_MAX_TOKENS = 1200;

export type AiTextResult = {
  content: string;
  source: "ai";
};

export type AiDiaryDraft = DraftDiary & {
  structured?: Partial<DiaryStructuredData>;
};

export type AiDraftResult = {
  draft: AiDiaryDraft;
  source: "ai";
};

export async function generateAssistantReply(input: { messages: ChatMessage[]; mode: EmotionModeId }): Promise<AiTextResult> {
  const settings = await getAiSettingsPrivate().catch(() => null);
  if (!settings) throw new Error("AI 配置有问题：请先在设置中保存并测试 AI 配置。");

  const content = await callChatCompletions({
    maxTokens: AI_REPLY_MAX_TOKENS,
    messages: buildAssistantPromptMessages(input),
    settings,
    timeoutMs: AI_REPLY_TIMEOUT_MS
  });

  return { content: content.trim(), source: "ai" };
}

export async function streamAssistantReply(input: { messages: ChatMessage[]; mode: EmotionModeId }): Promise<AsyncGenerator<string>> {
  const settings = await getAiSettingsPrivate().catch(() => null);
  if (!settings) throw new Error("AI 配置有问题：请先在设置中保存并测试 AI 配置。");

  return streamChatCompletions({
    maxTokens: AI_REPLY_MAX_TOKENS,
    messages: buildAssistantPromptMessages(input),
    settings,
    timeoutMs: AI_REPLY_TIMEOUT_MS
  });
}

export async function generateDiaryDraft(input: { messages: ChatMessage[]; mode: EmotionModeId }): Promise<AiDraftResult> {
  const settings = await getAiSettingsPrivate().catch(() => null);
  if (!settings) throw new Error("AI 配置有问题：请先在设置中保存并测试 AI 配置。");

  const content = await callChatCompletions({
    maxTokens: AI_DRAFT_MAX_TOKENS,
    messages: [
      { role: "system", content: commonSystemPrompt },
      { role: "system", content: modePrompts[input.mode] },
      { role: "system", content: diaryOutputPrompt },
      {
        role: "user",
        content: input.messages.map((message) => `${message.role}: ${message.content}`).join("\n")
      }
    ],
    settings,
    timeoutMs: AI_DRAFT_TIMEOUT_MS
  });
  const draft = parseDiaryDraft(content);
  if (!draft) throw new Error("AI 配置有问题：模型没有按要求返回日记 JSON，请检查模型是否支持当前 Prompt。");

  return { draft, source: "ai" };
}

export async function testAiConnection(input?: { apiKey?: string; baseUrl?: string; model?: string }) {
  const savedSettings = await getAiSettingsPrivate();
  const settings =
    input?.baseUrl || input?.model || input?.apiKey
      ? {
          apiKey: input.apiKey?.trim() || savedSettings?.apiKey || "",
          baseUrl: input.baseUrl?.trim() || savedSettings?.baseUrl || "",
          model: input.model?.trim() || savedSettings?.model || ""
        }
      : savedSettings;
  if (!settings) throw new Error("请先保存 AI 配置");
  if (!settings.baseUrl) throw new Error("请填写 Base URL");
  if (!settings.model) throw new Error("请填写模型名称");
  if (!settings.apiKey) throw new Error("请填写 API Key");

  await callChatCompletions({
    maxTokens: 24,
    messages: [
      { role: "system", content: "You are a connection test. Reply with OK." },
      { role: "user", content: "Reply OK" }
    ],
    settings,
    timeoutMs: AI_REPLY_TIMEOUT_MS
  });
}

async function callChatCompletions({
  maxTokens,
  messages,
  settings,
  timeoutMs
}: {
  maxTokens: number;
  messages: Array<{ content: string; role: "assistant" | "system" | "user" }>;
  settings: { apiKey: string; baseUrl: string; model: string };
  timeoutMs: number;
}) {
  const response = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    body: JSON.stringify(buildChatRequestBody(settings, {
      max_tokens: maxTokens,
      messages,
      model: settings.model
    })),
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs)
  }).catch((cause) => {
    if (isTimeoutError(cause)) {
      throw new Error(`AI 回复超时：模型在 ${timeoutMs / 1000} 秒内没有返回。可以稍后重试，或在设置里换一个响应更快的模型。`);
    }

    throw new Error("AI 请求失败：无法连接到模型服务，请检查 Base URL、网络代理或服务商状态。");
  });

  if (!response.ok) {
    throw new Error(`AI 请求失败：${response.status}${await readProviderError(response)}`);
  }

  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 响应为空");

  return content;
}

async function* streamChatCompletions({
  maxTokens,
  messages,
  settings,
  timeoutMs
}: {
  maxTokens: number;
  messages: Array<{ content: string; role: "assistant" | "system" | "user" }>;
  settings: { apiKey: string; baseUrl: string; model: string };
  timeoutMs: number;
}) {
  const response = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    body: JSON.stringify(buildChatRequestBody(settings, {
      max_tokens: maxTokens,
      messages,
      model: settings.model,
      stream: true
    })),
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs)
  }).catch((cause) => {
    if (isTimeoutError(cause)) {
      throw new Error(`AI 回复超时：模型在 ${timeoutMs / 1000} 秒内没有返回。可以稍后重试，或在设置里换一个响应更快的模型。`);
    }

    throw new Error("AI 请求失败：无法连接到模型服务，请检查 Base URL、网络代理或服务商状态。");
  });

  if (!response.ok) {
    throw new Error(`AI 请求失败：${response.status}${await readProviderError(response)}`);
  }
  if (!response.body) throw new Error("AI 响应为空");

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> };
        const delta = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? "";
        if (delta) yield delta;
      }
    }
  } catch (cause) {
    if (isTimeoutError(cause)) {
      throw new Error(`AI 回复超时：模型在 ${timeoutMs / 1000} 秒内没有返回。可以稍后重试，或在设置里换一个响应更快的模型。`);
    }
    throw cause;
  } finally {
    reader.releaseLock();
  }
}

function buildChatRequestBody(
  settings: { baseUrl: string; model: string },
  body: { max_tokens: number; messages: Array<{ content: string; role: "assistant" | "system" | "user" }>; model: string; stream?: boolean }
) {
  if (!isKimiOrMoonshot(settings)) return body;

  return {
    ...body,
    thinking: {
      type: "disabled"
    }
  };
}

function isKimiOrMoonshot(settings: { baseUrl: string; model: string }) {
  const baseUrl = settings.baseUrl.toLowerCase();
  const model = settings.model.toLowerCase();

  return baseUrl.includes("moonshot") || baseUrl.includes("kimi") || model.startsWith("kimi-") || model.startsWith("moonshot-");
}

function buildAssistantPromptMessages(input: { messages: ChatMessage[]; mode: EmotionModeId }) {
  return [
    { role: "system" as const, content: commonSystemPrompt },
    { role: "system" as const, content: modePrompts[input.mode] },
    { role: "system" as const, content: followUpPrompt },
    ...input.messages.map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      content: message.content
    }))
  ];
}

function isTimeoutError(cause: unknown) {
  if (!cause || typeof cause !== "object") return false;
  const error = cause as { code?: unknown; message?: unknown; name?: unknown };
  return error.name === "TimeoutError" || error.code === "ABORT_ERR" || (typeof error.message === "string" && error.message.toLowerCase().includes("timeout"));
}

async function readProviderError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return "";

  try {
    const body = JSON.parse(text) as { error?: { message?: string }; message?: string };
    const message = body.error?.message ?? body.message;
    return message ? `，${message}` : `，${text.slice(0, 240)}`;
  } catch {
    return `，${text.slice(0, 240)}`;
  }
}

function parseDiaryDraft(content: string): AiDiaryDraft | null {
  const text = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    const parsed = JSON.parse(text) as Partial<AiDiaryDraft>;
    if (typeof parsed.title !== "string" || typeof parsed.summary !== "string" || typeof parsed.diaryText !== "string") return null;

    return {
      diaryText: parsed.diaryText,
      structured: parsed.structured,
      summary: parsed.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 12) : [],
      title: parsed.title
    };
  } catch {
    return null;
  }
}
