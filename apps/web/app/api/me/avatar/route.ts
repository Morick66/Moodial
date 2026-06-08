import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUserAccount } from "@/lib/server/current-user";
import { saveUserPreferences } from "@/lib/server/user-preferences";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function POST(request: Request) {
  const account = await getCurrentUserAccount();
  if (!account || account.status !== "ACTIVE") return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "请选择头像图片" }, { status: 400 });
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) return NextResponse.json({ error: "头像只支持 JPG、PNG、WebP 或 GIF" }, { status: 400 });
  if (file.size > MAX_AVATAR_BYTES) return NextResponse.json({ error: "头像不能超过 2MB" }, { status: 400 });

  const fileName = `${randomUUID()}.${extension}`;
  const userDir = path.join(process.cwd(), "..", "..", "uploads", "avatars", account.id);
  await mkdir(userDir, { recursive: true });
  await writeFile(path.join(userDir, fileName), Buffer.from(await file.arrayBuffer()));

  const avatar = {
    contentType: file.type,
    file: fileName,
    type: "upload" as const,
    url: `/api/me/avatar/${fileName}`
  };
  await saveUserPreferences(account.id, { avatar });

  return NextResponse.json({ avatar });
}
