"use client";

import { useEffect, useMemo, useState } from "react";
import type { EntryListItem, EmotionModeId } from "@jzmle/core";
import { emotionModes } from "@jzmle/core";
import { RefreshCw, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DiaryList } from "@/components/diary/DiaryList";
import { IconButton } from "@/components/ui/IconButton";
import { clearStoredUserEntries, loadStoredUserEntries } from "@/lib/local-diary-store";
import { fetchEntries, migrateLocalEntriesToApi } from "@/lib/entry-api";

const migrationFlagKey = "jzmle_local_entries_migrated";

export function EntriesWorkspace() {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<EmotionModeId | "all">("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refreshEntries() {
    setLoading(true);
    setError("");

    try {
      setEntries(await fetchEntries({ mode: modeFilter, search }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "读取失败");
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
          if (!cancelled) setNotice(`已把 ${importedIds.length} 篇本地日记导入数据库。`);
        } else if (shouldMigrate) {
          window.localStorage.setItem(migrationFlagKey, "true");
        }

        const nextEntries = await fetchEntries({ mode: modeFilter, search });
        if (!cancelled) setEntries(nextEntries);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "读取失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void migrateThenLoad();
    return () => {
      cancelled = true;
    };
  }, [modeFilter, search]);

  const headingText = useMemo(() => {
    if (modeFilter === "all") return "这些天留下的记录";
    return emotionModes.find((mode) => mode.id === modeFilter)?.label ?? "这些天留下的记录";
  }, [modeFilter]);

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-dusk">日记本</p>
            <h2 className="mt-1 text-3xl font-semibold">{headingText}</h2>
            <p className="mt-2 text-sm leading-7 text-dusk">这里不做管理后台，只按时间把你放下来的事情收好。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-11 min-w-64 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-dusk shadow-button">
              <Search size={17} />
              <input
                className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-dusk"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索日记、情绪、标签..."
                value={search}
              />
            </label>
            <select
              className="h-11 rounded-full border-0 bg-white/70 px-4 text-sm text-ink shadow-button outline-none"
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
            <IconButton label="刷新" onClick={refreshEntries}>
              <RefreshCw size={18} />
            </IconButton>
          </div>
        </div>

        {notice ? <p className="mb-4 rounded-2xl bg-sage/70 px-4 py-3 text-sm text-moss">{notice}</p> : null}
        {error ? <p className="mb-4 rounded-2xl bg-blush px-4 py-3 text-sm text-rosewood">{error}</p> : null}
        {loading ? <p className="rounded-[1.5rem] bg-white/60 p-10 text-center text-sm text-dusk">正在翻开日记本...</p> : <DiaryList entries={entries} />}
      </section>
    </AppShell>
  );
}
