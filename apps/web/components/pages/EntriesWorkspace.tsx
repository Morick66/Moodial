"use client";

import { useEffect, useMemo, useState } from "react";
import type { EntryListItem, EmotionModeId } from "@jzmle/core";
import { emotionModes } from "@jzmle/core";
import { BookOpen, RefreshCw, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DiaryList } from "@/components/diary/DiaryList";
import { useToast } from "@/components/toast/ToastProvider";
import { IconButton } from "@/components/ui/IconButton";
import { clearStoredUserEntries, loadStoredUserEntries } from "@/lib/local-diary-store";
import { fetchEntries, fetchEntryTags, migrateLocalEntriesToApi, type EntryTagOption } from "@/lib/entry-api";

const migrationFlagKey = "jzmle_local_entries_migrated";

export function EntriesWorkspace() {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<EmotionModeId | "all">("all");
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "locked" | "normal">("all");
  const [tagFilter, setTagFilter] = useState("");
  const [tagOptions, setTagOptions] = useState<EntryTagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  async function refreshEntries() {
    setLoading(true);

    try {
      setEntries(await fetchEntries({ mode: modeFilter, privacy: privacyFilter, search, tag: tagFilter }));
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "读取失败", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function migrateThenLoad() {
      setLoading(true);
      try {
        const shouldMigrate = window.localStorage.getItem(migrationFlagKey) !== "true";
        const storedEntries = shouldMigrate ? loadStoredUserEntries() : [];
        if (storedEntries.length > 0) {
          const importedIds = await migrateLocalEntriesToApi(storedEntries);
          clearStoredUserEntries();
          window.localStorage.setItem(migrationFlagKey, "true");
          if (!cancelled) showToast({ message: `已把 ${importedIds.length} 篇本地日记导入数据库。`, type: "success" });
        } else if (shouldMigrate) {
          window.localStorage.setItem(migrationFlagKey, "true");
        }

        const [nextEntries, nextTags] = await Promise.all([fetchEntries({ mode: modeFilter, privacy: privacyFilter, search, tag: tagFilter }), fetchEntryTags()]);
        if (!cancelled) setEntries(nextEntries);
        if (!cancelled) setTagOptions(nextTags);
      } catch (cause) {
        if (!cancelled) showToast({ message: cause instanceof Error ? cause.message : "读取失败", type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void migrateThenLoad();
    return () => {
      cancelled = true;
    };
  }, [modeFilter, privacyFilter, search, tagFilter, showToast]);

  const headingText = useMemo(() => {
    if (modeFilter === "all") return "这些天留下的记录";
    return emotionModes.find((mode) => mode.id === modeFilter)?.label ?? "这些天留下的记录";
  }, [modeFilter]);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl">
        <div className="moodial-glass mb-6 overflow-hidden rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1 text-sm font-semibold text-[#875cff] shadow-button">
              <BookOpen size={16} /> 日记本
            </p>
            <h2 className="mt-4 text-4xl font-black text-[#11163d]">{headingText}</h2>
            <p className="mt-3 text-sm leading-7 text-[#777299]">这里不做管理后台，只按时间把你放下来的事情收好。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-11 min-w-64 items-center gap-2 rounded-full bg-white/72 px-4 text-sm text-[#777299] shadow-button">
              <Search size={17} />
              <input
                className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-[#aaa4bd]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索日记、情绪、标签..."
                value={search}
              />
            </label>
            <select
              className="h-11 rounded-full border-0 bg-white/72 px-4 text-sm text-[#272a51] shadow-button outline-none"
              onChange={(event) => setModeFilter(event.target.value as EmotionModeId | "all")}
              value={modeFilter}
            >
              <option value="all">全部情绪</option>
              {emotionModes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-full border-0 bg-white/72 px-4 text-sm text-[#272a51] shadow-button outline-none"
              onChange={(event) => setPrivacyFilter(event.target.value as "all" | "locked" | "normal")}
              value={privacyFilter}
            >
              <option value="all">全部隐私</option>
              <option value="normal">普通日记</option>
              <option value="locked">锁定日记</option>
            </select>
            <select
              className="h-11 rounded-full border-0 bg-white/72 px-4 text-sm text-[#272a51] shadow-button outline-none"
              onChange={(event) => setTagFilter(event.target.value)}
              value={tagFilter}
            >
              <option value="">全部标签</option>
              {tagOptions.map((item) => (
                <option key={item.tag} value={item.tag}>
                  {item.tag}（{item.count}）
                </option>
              ))}
            </select>
            <IconButton label="刷新" onClick={refreshEntries}>
              <RefreshCw size={18} />
            </IconButton>
          </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#81799d]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/52 px-3 py-2 shadow-button">
              <Sparkles size={15} /> 共 {entries.length} 篇
            </span>
            <span className="inline-flex rounded-full bg-white/52 px-3 py-2 shadow-button">搜索和筛选会自动保存当前视图</span>
          </div>
        </div>

        {loading ? <p className="rounded-[1.5rem] bg-white/60 p-10 text-center text-sm text-[#777299]">正在翻开日记本...</p> : <DiaryList entries={entries} />}
      </section>
    </AppShell>
  );
}
