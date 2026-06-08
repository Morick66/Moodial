export type AiSettings = {
  baseUrl: string;
  configured: boolean;
  hasApiKey: boolean;
  model: string;
  provider: "openai_compatible";
};

export async function fetchAiSettings() {
  const response = await fetch("/api/ai-settings", {
    cache: "no-store"
  });
  if (!response.ok) throw new Error(await readError(response, "无法读取 AI 配置"));

  return (await response.json()) as AiSettings;
}

export async function saveAiSettings(input: { apiKey?: string; baseUrl: string; model: string; provider: "openai_compatible" }) {
  const response = await fetch("/api/ai-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(await readError(response, "保存 AI 配置失败"));

  return (await response.json()) as AiSettings;
}

export async function testAiSettings(input?: { apiKey?: string; baseUrl: string; model: string; provider: "openai_compatible" }) {
  const response = await fetch("/api/ai-settings/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: input ? JSON.stringify(input) : undefined
  });
  if (!response.ok) throw new Error(await readError(response, "AI 连接测试失败"));

  return (await response.json()) as { ok: true };
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
