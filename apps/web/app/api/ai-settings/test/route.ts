import { NextResponse } from "next/server";
import { testAiConnection } from "@/lib/server/ai-adapter";
import { requireCurrentUserAccount } from "@/lib/server/current-user";

export async function POST(request: Request) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (account.role !== "ADMIN") return NextResponse.json({ error: "只有管理员可以测试 AI 配置" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const input =
    body && typeof body === "object"
      ? {
          apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
          baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined,
          model: typeof body.model === "string" ? body.model : undefined
        }
      : undefined;

  try {
    await testAiConnection(input);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "AI 连接测试失败";
    return NextResponse.json({ error: message, ok: false }, { status: 400 });
  }
}
