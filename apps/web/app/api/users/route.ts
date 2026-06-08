import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { createAuthBackedUser } from "@/lib/server/user-management";

export async function GET() {
  const currentAccount = await requireCurrentUserAccount();
  if (!currentAccount) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (currentAccount.role !== "ADMIN") return NextResponse.json({ error: "只有管理员可以查看用户" }, { status: 403 });

  const users = await prisma.userAccount.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true
    }
  });

  return NextResponse.json(
    users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    }))
  );
}

export async function POST(request: Request) {
  const currentAccount = await requireCurrentUserAccount();
  if (!currentAccount) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (currentAccount.role !== "ADMIN") return NextResponse.json({ error: "只有管理员可以创建用户" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    const { profile } = await createAuthBackedUser({
      displayName,
      password,
      role: "USER",
      username
    });

    return NextResponse.json(
      {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        role: profile.role,
        status: profile.status,
        createdAt: profile.createdAt.toISOString()
      },
      { status: 201 }
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "创建用户失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
