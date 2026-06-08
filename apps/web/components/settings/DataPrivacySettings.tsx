"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { signOut } from "@/lib/auth-api";
import { deleteMyAccountData } from "@/lib/user-api";
import { SettingsCard } from "@/components/settings/SettingsPrimitives";

export function DataPrivacySettings() {
  const router = useRouter();
  const [deletingSelf, setDeletingSelf] = useState(false);
  const { showToast } = useToast();

  async function deleteSelf() {
    const confirmed = window.confirm("确定要删除当前账号数据吗？这会软删除你的日记和会话，并立即登出。");
    if (!confirmed) return;

    setDeletingSelf(true);
    try {
      await deleteMyAccountData();
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "删除账号数据失败", type: "error" });
      setDeletingSelf(false);
    }
  }

  return (
    <SettingsCard
      description="导出只包含当前登录账号自己的未删除日记。删除账号数据会软删除当前账号、日记和会话。"
      icon={<Download size={18} />}
      title="数据与隐私"
    >
      <div className="flex flex-wrap gap-2">
        <a className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-rosewood shadow-button" href="/api/export/json">
          <Download size={17} />
          导出 JSON
        </a>
        <a className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-rosewood shadow-button" href="/api/export/markdown">
          <Download size={17} />
          导出 Markdown
        </a>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/55 px-4 py-3 text-sm leading-6 text-dusk">
          <p className="font-medium text-ink">导出范围预览</p>
          <p className="mt-1">当前导出包含你的未删除日记、标签、结构化线索和原始对话，不包含其他用户数据。</p>
        </div>
        <div className="rounded-2xl bg-white/55 px-4 py-3 text-sm leading-6 text-dusk">
          <p className="font-medium text-ink">备份与恢复</p>
          <p className="mt-1">首版先提供导出备份。导入恢复、定时备份和彻底删除审计会在后续版本补齐。</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blush bg-blush/45 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="font-medium text-rosewood">删除我的账号数据</h4>
            <p className="mt-2 text-sm leading-6 text-clay">删除后会立即登出，之后该账号不能再访问日记/API。</p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/80 px-4 text-sm text-rosewood shadow-button disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deletingSelf}
            onClick={deleteSelf}
            type="button"
          >
            {deletingSelf ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
            {deletingSelf ? "删除中" : "删除我的数据"}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}
