import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { softDeleteUserData } from "@/lib/server/user-management";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentAccount = await requireCurrentUserAccount();
  if (!currentAccount) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (currentAccount.role !== "ADMIN") return NextResponse.json({ error: "只有管理员可以修改用户状态" }, { status: 403 });

  const { id } = await context.params;
  if (id === currentAccount.id) return NextResponse.json({ error: "不能修改自己的账号状态" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const status = body?.status;
  if (status !== "ACTIVE" && status !== "DISABLED" && status !== "DELETED") {
    return NextResponse.json({ error: "用户状态无效" }, { status: 400 });
  }

  const target = await prisma.userAccount.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  if (target.role === "ADMIN") return NextResponse.json({ error: "不能通过这里修改管理员账号" }, { status: 400 });

  if (status === "DELETED") {
    await prisma.$transaction(async (tx) => {
      await softDeleteUserData(id, tx);
    });
  } else {
    await prisma.userAccount.update({
      where: { id },
      data: {
        deletedAt: null,
        status
      }
    });
  }

  const user = await prisma.userAccount.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString()
  });
}
