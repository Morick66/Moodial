import { NextResponse } from "next/server";
import type { EntryWriteInput } from "@jzmle/core";
import { prisma } from "@jzmle/db";
import { requireCurrentUserAccount } from "@/lib/server/current-user";
import { createStructured, parseEntryDate, parseEntryInput, toDetail, toPrismaJson, toPrismaMode } from "@/lib/server/entry-mapper";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;

  const entry = await prisma.diaryEntry.findFirst({
    where: { id, userId: account.id, deletedAt: null }
  });

  if (!entry) return NextResponse.json({ error: "日记不存在" }, { status: 404 });
  return NextResponse.json(toDetail(entry));
}

export async function PATCH(request: Request, context: RouteContext) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;

  const existing = await prisma.diaryEntry.findFirst({
    where: { id, userId: account.id, deletedAt: null }
  });
  if (!existing) return NextResponse.json({ error: "日记不存在" }, { status: 404 });

  const parsed = parseEntryInput(await request.json().catch(() => null), true);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const input = parsed.input as Partial<EntryWriteInput>;
  const structured = createStructured({
    mode: input.mode ?? (existing.mode.toLowerCase() as never),
    diaryText: input.diaryText ?? existing.diaryText,
    summary: input.summary ?? existing.oneSentenceSummary,
    tags: input.tags,
    structured: input.structured,
    rawConversation: input.rawConversation
  });

  const entry = await prisma.diaryEntry.update({
    where: { id },
    data: {
      ...(input.date ? { date: parseEntryDate(input.date) } : {}),
      ...(input.mode ? { mode: toPrismaMode(input.mode) } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.diaryText ? { diaryText: input.diaryText } : {}),
      ...(input.summary ? { oneSentenceSummary: input.summary } : {}),
      ...(input.structured || input.tags ? { structuredJson: toPrismaJson(structured) } : {}),
      ...(input.rawConversation ? { rawConversation: toPrismaJson(input.rawConversation) } : {}),
      userEdited: true
    }
  });

  return NextResponse.json(toDetail(entry));
}

export async function DELETE(_: Request, context: RouteContext) {
  const account = await requireCurrentUserAccount();
  if (!account) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;

  const existing = await prisma.diaryEntry.findFirst({
    where: { id, userId: account.id, deletedAt: null }
  });
  if (!existing) return NextResponse.json({ error: "日记不存在" }, { status: 404 });

  await prisma.diaryEntry.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return new Response(null, { status: 204 });
}
