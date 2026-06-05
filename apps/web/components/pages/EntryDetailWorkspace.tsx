"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EntryDetail } from "@jzmle/core";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { deleteEntry, fetchEntry, updateEntry } from "@/lib/entry-api";

export function EntryDetailWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [title, setTitle] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextEntry = await fetchEntry(id);
        if (cancelled) return;
        setEntry(nextEntry);
        setTitle(nextEntry.title);
        setDiaryText(nextEntry.diaryText);
        setSummary(nextEntry.summary);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "读取失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const structuredPairs = useMemo(() => {
    if (!entry) return [];
    return [
      ["场景", entry.structured.scenes],
      ["事件", entry.structured.events],
      ["人物", entry.structured.people],
      ["情绪", entry.structured.emotions],
      ["身体状态", entry.structured.bodyState],
      ["需求", entry.structured.needs]
    ].filter(([, value]) => Array.isArray(value) && value.length > 0) as [string, string[]][];
  }, [entry]);

  async function save() {
    if (!entry || saving) return;
    setSaving(true);
    setError("");

    try {
      const nextEntry = await updateEntry(entry.id, {
        title,
        diaryText,
        summary,
        tags: entry.tags,
        structured: entry.structured
      });
      setEntry(nextEntry);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!entry) return;
    await deleteEntry(entry.id);
    router.push("/entries");
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm text-dusk hover:text-rosewood" href="/entries">
          <ArrowLeft size={16} />
          回到日记本
        </Link>

        {loading ? <p className="rounded-[1.5rem] bg-white/60 p-10 text-center text-sm text-dusk">正在翻开这一页...</p> : null}
        {error ? <p className="mb-4 rounded-2xl bg-blush px-4 py-3 text-sm text-rosewood">{error}</p> : null}

        {entry ? (
          <article className="rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-gentle backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-dusk">{entry.date}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{entry.modeLabel}</Badge>
                  {entry.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm shadow-button" onClick={save} type="button">
                  <Save size={16} />
                  {saving ? "保存中" : "保存"}
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-blush px-4 text-sm text-rosewood shadow-button" onClick={remove} type="button">
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </div>

            <input
              className="mt-6 w-full bg-transparent text-3xl font-semibold leading-tight outline-none"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
            <textarea
              className="mt-4 min-h-20 w-full resize-none rounded-[1.25rem] border border-white/80 bg-paper/60 px-4 py-3 text-sm leading-7 text-dusk outline-none focus:border-rosewood/30"
              onChange={(event) => setSummary(event.target.value)}
              value={summary}
            />
            <textarea
              className="mt-5 min-h-80 w-full resize-y rounded-[1.5rem] border border-white/80 bg-white/70 px-5 py-4 text-base leading-8 outline-none focus:border-rosewood/30"
              onChange={(event) => setDiaryText(event.target.value)}
              value={diaryText}
            />

            {structuredPairs.length > 0 ? (
              <div className="mt-6 rounded-[1.5rem] bg-sage/40 p-4">
                <h3 className="font-medium">结构化线索</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {structuredPairs.map(([label, values]) => (
                    <div key={label}>
                      <p className="text-xs text-dusk">{label}</p>
                      <p className="mt-1 text-sm text-ink">{values.join("、")}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ) : null}
      </section>
    </AppShell>
  );
}
