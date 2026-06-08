import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { toDetail } from "@/lib/server/entry-mapper";

export async function GET() {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId: account.id,
      deletedAt: null
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify(entries.map(toDetail), null, 2);

  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="moodial-export-${exportedAt.slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
