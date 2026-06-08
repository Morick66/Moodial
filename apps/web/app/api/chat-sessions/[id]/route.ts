import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { toChatSessionDetail } from "@/lib/server/chat-session-mapper";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await context.params;
  const session = await prisma.chatSession.findFirst({
    where: { id, userId: account.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  return NextResponse.json(toChatSessionDetail(session));
}
