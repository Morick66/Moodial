import { NextResponse } from "next/server";
import type { EntryWriteInput } from "@jzmle/core";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { createStructured, parseEmotionMode, parseEntryDate, parseEntryInput, toDetail, toListItem, toPrismaJson, toPrismaMode } from "@/lib/server/entry-mapper";

export async function GET(request: Request) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mode = parseEmotionMode(searchParams.get("mode"));
  const search = searchParams.get("search")?.trim();
  const tag = searchParams.get("tag")?.trim();
  const privacy = searchParams.get("privacy");

  let entries = await prisma.diaryEntry.findMany({
    where: {
      userId: account.id,
      deletedAt: null,
      ...(mode ? { mode: toPrismaMode(mode) } : {}),
      ...(privacy === "locked" ? { privacyLevel: "LOCKED" as const } : privacy === "normal" ? { privacyLevel: "NORMAL" as const } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { diaryText: { contains: search, mode: "insensitive" } },
              { oneSentenceSummary: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  if (tag) {
    entries = entries.filter((entry) => toDetail(entry).tags.includes(tag));
  }

  return NextResponse.json(entries.map(toListItem));
}

export async function POST(request: Request) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const parsed = parseEntryInput(await request.json().catch(() => null));
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const input = parsed.input as EntryWriteInput;
  const structured = createStructured(input);

  const entry = await prisma.diaryEntry.create({
    data: {
      userId: account.id,
      date: parseEntryDate(input.date),
      mode: toPrismaMode(input.mode),
      title: input.title ?? input.summary,
      diaryText: input.diaryText,
      oneSentenceSummary: input.summary,
      privacyLevel: input.privacyLevel === "locked" ? "LOCKED" : "NORMAL",
      structuredJson: toPrismaJson(structured),
      rawConversation: toPrismaJson(input.rawConversation ?? [])
    }
  });

  return NextResponse.json(toDetail(entry), { status: 201 });
}
