"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EntryDetail } from "@jzmle/core";
import { ArrowLeft, Edit3, ListTree, Lock, MessageSquareText, Save, Trash2, Unlock, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/toast/ToastProvider";
import { deleteEntry, fetchEntry, updateEntry } from "@/lib/entry-api";

export function EntryDetailWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [title, setTitle] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [summary, setSummary] = useState("");
  const [tagText, setTagText] = useState("");
  const [drawer, setDrawer] = useState<"conversation" | "structured" | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

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
        setTagText(nextEntry.tags.join("、"));
      } catch (cause) {
        if (!cancelled) showToast({ message: cause instanceof Error ? cause.message : "读取失败", type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  const structuredPairs = useMemo(() => {
    if (!entry) return [];
    return [
      ["场景", entry.structured.scenes],
      ["事件", entry.structured.events],
      ["人物", entry.structured.people],
      ["情绪", entry.structured.emotions],
      ["身体状态", entry.structured.bodyState],
      ["触发点", entry.structured.trigger],
      ["自动想法", entry.structured.automaticThoughts],
      ["需求", entry.structured.needs],
      ["可选行动", entry.structured.actions]
    ].filter(([, value]) => Array.isArray(value) && value.length > 0) as [string, string[]][];
  }, [entry]);

  const isFallbackDraft = entry?.tags.includes("未 AI 精修");

  async function save() {
    if (!entry || saving) return;
    setSaving(true);

    try {
      const tags = parseTags(tagText);
      const nextEntry = await updateEntry(entry.id, {
        title,
        diaryText,
        summary,
        tags,
        structured: entry.structured
      });
      setEntry(nextEntry);
      setEditing(false);
      showToast({ message: "日记已保存。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "保存失败", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      showToast({ message: "日记已删除。", type: "success" });
      router.push("/entries");
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "删除失败", type: "error" });
    }
  }

  async function togglePrivacy() {
    if (!entry || saving) return;
    setSaving(true);

    try {
      const nextPrivacyLevel = entry.privacyLevel === "locked" ? "normal" : "locked";
      const nextEntry = await updateEntry(entry.id, { privacyLevel: nextPrivacyLevel });
      setEntry(nextEntry);
      showToast({ message: nextPrivacyLevel === "locked" ? "这篇日记已锁定。" : "这篇日记已设为普通。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "修改隐私状态失败", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    if (!entry) return;
    setTitle(entry.title);
    setDiaryText(entry.diaryText);
    setSummary(entry.summary);
    setTagText(entry.tags.join("、"));
    setEditing(true);
  }

  function cancelEdit() {
    if (!entry) return;
    setTitle(entry.title);
    setDiaryText(entry.diaryText);
    setSummary(entry.summary);
    setTagText(entry.tags.join("、"));
    setEditing(false);
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/56 px-4 py-2 text-sm text-[#6f61a0] shadow-button hover:text-[#875cff]" href="/entries">
          <ArrowLeft size={16} />
          回到日记本
        </Link>

        {loading ? <p className="rounded-[1.5rem] bg-white/60 p-10 text-center text-sm text-[#777299]">正在翻开这一页...</p> : null}

        {entry ? (
          <article className="moodial-glass rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#875cff]">{entry.date}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{entry.modeLabel}</Badge>
                  {entry.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm text-[#6f61a0] shadow-button hover:text-[#875cff]" onClick={() => setDrawer("structured")} type="button">
                  <ListTree size={16} />
                  查看线索
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm text-[#6f61a0] shadow-button hover:text-[#875cff]" onClick={() => setDrawer("conversation")} type="button">
                  <MessageSquareText size={16} />
                  查看原文
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm text-[#6f61a0] shadow-button hover:text-[#875cff]" disabled={saving} onClick={togglePrivacy} type="button">
                  {entry.privacyLevel === "locked" ? <Unlock size={16} /> : <Lock size={16} />}
                  {entry.privacyLevel === "locked" ? "取消锁定" : "锁定日记"}
                </button>
                {editing ? (
                  <>
                    <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm shadow-button" onClick={cancelEdit} type="button">
                      <X size={16} />
                      取消
                    </button>
                    <button className="moodial-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-white" disabled={saving} onClick={save} type="button">
                      <Save size={16} />
                      {saving ? "保存中" : "保存修改"}
                    </button>
                  </>
                ) : (
                  <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/72 px-4 text-sm shadow-button" onClick={startEdit} type="button">
                    <Edit3 size={16} />
                    编辑日记
                  </button>
                )}
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-[#fff0f6] px-4 text-sm text-[#ef5e91] shadow-button" onClick={remove} type="button">
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </div>

            {editing ? (
              <input className="mt-6 w-full bg-transparent text-3xl font-black leading-tight text-[#11163d] outline-none" onChange={(event) => setTitle(event.target.value)} value={title} />
            ) : (
              <h1 className="mt-6 text-3xl font-black leading-tight text-[#11163d]">{entry.title}</h1>
            )}
            {isFallbackDraft ? (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-clay">
                这篇是未 AI 精修的临时整理，已经安全保存。AI 配置可用后，可以再把正文手动调整成更贴近自己的版本。
              </p>
            ) : null}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-[#81799d]">一句话总结</p>
              {editing ? (
                <textarea
                  className="min-h-20 w-full resize-none rounded-[1.25rem] border border-[#e6dcff] bg-white/62 px-4 py-3 text-sm leading-7 text-[#6f688c] outline-none focus:border-[#875cff]/35"
                  onChange={(event) => setSummary(event.target.value)}
                  value={summary}
                />
              ) : (
                <p className="rounded-[1.25rem] bg-white/56 px-4 py-3 text-sm leading-7 text-[#6f688c] shadow-button">{entry.summary}</p>
              )}
            </div>
            {editing ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-[#81799d]">标签</p>
                <input
                  className="h-11 w-full rounded-[1.25rem] border border-[#e6dcff] bg-white/62 px-4 text-sm text-[#6f688c] outline-none focus:border-[#875cff]/35"
                  onChange={(event) => setTagText(event.target.value)}
                  placeholder="用顿号、逗号或空格分隔"
                  value={tagText}
                />
              </div>
            ) : null}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-[#81799d]">自然语言日记</p>
              {editing ? (
                <textarea
                  className="min-h-80 w-full resize-y rounded-[1.5rem] border border-[#e6dcff] bg-white/72 px-5 py-4 text-base leading-8 outline-none focus:border-[#875cff]/35"
                  onChange={(event) => setDiaryText(event.target.value)}
                  value={diaryText}
                />
              ) : (
                <div className="whitespace-pre-wrap rounded-[1.5rem] bg-white/72 px-5 py-4 text-base leading-8 shadow-button">{entry.diaryText}</div>
              )}
            </div>
          </article>
        ) : null}
        {entry ? (
          <EntryDetailDrawer
            entry={entry}
            onClose={() => setDrawer(null)}
            open={drawer}
            structuredPairs={structuredPairs}
          />
        ) : null}
      </section>
    </AppShell>
  );
}

function EntryDetailDrawer({
  entry,
  onClose,
  open,
  structuredPairs
}: {
  entry: EntryDetail;
  onClose: () => void;
  open: "conversation" | "structured" | null;
  structuredPairs: [string, string[]][];
}) {
  if (!open) return null;
  const showStructured = open === "structured";

  return (
    <div className="fixed inset-0 z-50 bg-[#171441]/20 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-[#fbf7ff] p-5 shadow-soft sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#875cff]">{showStructured ? "结构化线索" : "聊天原文"}</p>
            <h2 className="mt-1 text-2xl font-black text-[#11163d]">{showStructured ? "整理出来的线索" : "当时聊过的话"}</h2>
          </div>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#6f61a0] shadow-button hover:text-[#875cff]" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
          {showStructured ? (
            <div className="grid gap-3">
              {entry.structured.coreFeeling ? <StructuredItem label="核心感受" value={entry.structured.coreFeeling} /> : null}
              {structuredPairs.map(([label, values]) => (
                <StructuredItem key={label} label={label} value={values.join("、")} />
              ))}
              {entry.structured.safetyFlag !== "none" ? <StructuredItem label="安全标记" value={entry.structured.safetyFlag} /> : null}
              {!entry.structured.coreFeeling && structuredPairs.length === 0 && entry.structured.safetyFlag === "none" ? (
                <p className="rounded-2xl bg-white/70 p-4 text-sm text-[#81799d]">这篇日记没有额外结构化线索。</p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2">
              {entry.rawConversation.length > 0 ? (
                entry.rawConversation.map((message) => (
                  <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-button" key={message.id}>
                    <p className="text-xs text-[#81799d]">{message.role === "user" ? "我" : "Moodial"}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{message.content}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-white/70 p-4 text-sm text-[#81799d]">这篇日记没有保存聊天原文。</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function StructuredItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-button">
      <p className="text-xs text-[#81799d]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink">{value}</p>
    </div>
  );
}

function parseTags(value: string) {
  return Array.from(new Set(value.split(/[、,\s]+/).map((tag) => tag.trim()).filter(Boolean))).slice(0, 12);
}
