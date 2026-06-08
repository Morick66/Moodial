import { NextResponse } from "next/server";
import { getAiSettingsPublic, saveAiSettings } from "@/lib/server/ai-settings";
import { requireCurrentUserAccount } from "@/lib/server/current-user";

export async function GET() {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  return NextResponse.json(await getAiSettingsPublic());
}

export async function PATCH(request: Request) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (account.role !== "ADMIN") return NextResponse.json({ error: "只有管理员可以修改 AI 配置" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const provider = body?.provider === "openai_compatible" ? "openai_compatible" : null;
  const baseUrl = typeof body?.baseUrl === "string" ? body.baseUrl.trim() : "";
  const model = typeof body?.model === "string" ? body.model.trim() : "";
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey : undefined;

  if (!provider) return NextResponse.json({ error: "暂时只支持 OpenAI-Compatible" }, { status: 400 });

  try {
    const settings = await saveAiSettings({
      apiKey,
      baseUrl,
      model,
      provider
    });

    return NextResponse.json(settings);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "保存 AI 配置失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
