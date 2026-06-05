import { NextResponse } from "next/server";
import { createInitialSetup } from "@/lib/server/setup";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const instanceName = typeof body?.instanceName === "string" ? body.instanceName.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!instanceName) return NextResponse.json({ error: "请填写实例名称" }, { status: 400 });
  if (!username) return NextResponse.json({ error: "请填写管理员用户名" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "管理员密码至少 8 位" }, { status: 400 });

  try {
    const status = await createInitialSetup({
      instanceName,
      username,
      displayName: displayName || username,
      password
    });
    return NextResponse.json(status, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error && cause.message.includes("实例已经初始化") ? cause.message : "初始化失败，请检查数据库连接和账号信息。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
