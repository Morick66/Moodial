import { NextResponse } from "next/server";
import { prisma } from "@jzmle/db";
import type { DiaryStructuredData, EntryDetail } from "@jzmle/core";
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
  const markdown = renderMarkdownExport({
    entries: entries.map(toDetail),
    exportedAt,
    username: account.displayName || account.username
  });

  return new Response(markdown, {
    headers: {
      "Content-Disposition": `attachment; filename="moodial-export-${exportedAt.slice(0, 10)}.md"`,
      "Content-Type": "text/markdown; charset=utf-8"
    }
  });
}

function renderMarkdownExport({ entries, exportedAt, username }: { entries: EntryDetail[]; exportedAt: string; username: string }) {
  const lines = [`# Moodial 日记导出`, "", `导出用户：${username}`, `导出时间：${exportedAt}`, `日记数量：${entries.length}`, ""];

  if (entries.length === 0) {
    lines.push("当前账号还没有可导出的日记。", "");
    return lines.join("\n");
  }

  for (const entry of entries) {
    lines.push(`## ${entry.date} ${entry.title}`, "");
    lines.push(`- 情绪入口：${entry.modeLabel}`);
    lines.push(`- 一句话总结：${entry.summary}`);
    if (entry.tags.length > 0) lines.push(`- 标签：${entry.tags.join("、")}`);
    lines.push("");
    lines.push(entry.diaryText.trim());
    lines.push("");

    const structuredLines = renderStructured(entry.structured);
    if (structuredLines.length > 0) {
      lines.push("### 结构化线索", "");
      lines.push(...structuredLines);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderStructured(structured: DiaryStructuredData) {
  const rows: [string, string | string[]][] = [
    ["场景", structured.scenes],
    ["事件", structured.events],
    ["人物", structured.people],
    ["情绪", structured.emotions],
    ["身体状态", structured.bodyState],
    ["触发点", structured.trigger],
    ["自动想法", structured.automaticThoughts],
    ["核心感受", structured.coreFeeling],
    ["需求", structured.needs],
    ["可选行动", structured.actions],
    ["安全标记", structured.safetyFlag === "none" ? "" : structured.safetyFlag]
  ];

  return rows
    .map(([label, value]) => {
      const text = Array.isArray(value) ? value.join("、") : value;
      return text ? `- ${label}：${text}` : "";
    })
    .filter(Boolean);
}
