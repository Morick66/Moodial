"use client";

import { useState } from "react";
import { Loader2, Save, Server, ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/toast/ToastProvider";
import { updateInstanceName } from "@/lib/setup-api";
import type { SettingsContext } from "@/components/settings/settings-types";
import { SettingsCard, SettingsField } from "@/components/settings/SettingsPrimitives";

export function InstanceStatusPanel({ context }: { context: SettingsContext }) {
  const [instanceName, setInstanceName] = useState(context.status?.instanceName ?? "");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function saveInstanceName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const status = await updateInstanceName(instanceName);
      context.setStatus(status);
      showToast({ message: "实例名称已保存。", type: "success" });
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "保存实例名称失败", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard description="实例设置只影响当前自部署空间。数据库连接和初始化状态用于本地验收。" icon={<Server size={18} />} title="实例状态">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusPill icon={<Server size={17} />} label="数据库" value={context.loading ? "检查中" : context.status?.database === "connected" ? "已连接" : "不可用"} />
        <StatusPill icon={<ShieldCheck size={17} />} label="初始化" value={context.status?.initialized ? "已完成" : "未完成"} />
        <StatusPill icon={<ShieldCheck size={17} />} label="管理员" value={context.status?.hasAdmin ? "已创建" : "未创建"} />
        <StatusPill icon={<ShieldCheck size={17} />} label="AI Key" value={context.aiSettings?.configured ? "已配置" : "待配置"} />
      </div>

      <form className="mt-5" onSubmit={saveInstanceName}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <SettingsField disabled={saving} label="实例名称" onChange={setInstanceName} placeholder="我的 Moodial" value={instanceName} />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            保存名称
          </button>
        </div>
      </form>

      <div className={`mt-5 rounded-2xl border p-4 ${context.status?.database === "error" ? "border-blush bg-blush/60" : "border-sage bg-sage/50"}`}>
        <p className={`text-sm leading-6 ${context.status?.database === "error" ? "text-rosewood" : "text-moss"}`}>
          {context.status?.database === "error"
            ? context.status.error ?? "数据库暂不可用，请检查 DATABASE_URL 和 PostgreSQL 服务。"
            : "当前日记保存已经走 API + 数据库 + 登录用户隔离。未登录请求日记 API 会返回 401。"}
        </p>
      </div>
    </SettingsCard>
  );
}
