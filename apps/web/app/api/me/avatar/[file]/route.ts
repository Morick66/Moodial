import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUserAccount } from "@/lib/server/current-user";
import { getUserPreferences } from "@/lib/server/user-preferences";

type RouteContext = {
  params: Promise<{ file: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const account = await getCurrentUserAccount();
  if (!account || account.status !== "ACTIVE") return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { file } = await context.params;
  if (!/^[a-zA-Z0-9_.-]+$/.test(file)) return NextResponse.json({ error: "头像不存在" }, { status: 404 });

  const preferences = await getUserPreferences(account.id);
  if (preferences.avatar.type !== "upload" || preferences.avatar.file !== file) {
    return NextResponse.json({ error: "头像不存在" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "..", "..", "uploads", "avatars", account.id, file);
  const buffer = await readFile(filePath).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "头像不存在" }, { status: 404 });

  return new Response(buffer, {
    headers: {
      "Cache-Control": "private, max-age=86400",
      "Content-Type": preferences.avatar.contentType
    }
  });
}
