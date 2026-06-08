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
    }
  });

  const tagCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of toDetail(entry).tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return NextResponse.json(
    Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ count, tag }))
      .sort((first, second) => second.count - first.count || first.tag.localeCompare(second.tag, "zh-CN"))
  );
}
