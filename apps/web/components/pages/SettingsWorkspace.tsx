"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Download, KeyRound, Server, Sparkles, UserRound, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AiSettingsPanel } from "@/components/settings/AiSettingsPanel";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { InstanceStatusPanel } from "@/components/settings/InstanceStatusPanel";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { UserManagementPanel } from "@/components/settings/UserManagementPanel";
import type { SettingsContext, SettingsSectionId } from "@/components/settings/settings-types";
import { useToast } from "@/components/toast/ToastProvider";
import { fetchAiSettings, type AiSettings } from "@/lib/ai-settings-api";
import { fetchMe, type MeStatus } from "@/lib/me-api";
import { fetchSetupStatus, type SetupStatus } from "@/lib/setup-api";
import { fetchUsers, type ManagedUser } from "@/lib/user-api";

const baseSections: Array<{ id: SettingsSectionId; icon: ReactNode; label: string }> = [
  { id: "profile", icon: <UserRound size={17} />, label: "个人设置" },
  { id: "data", icon: <Download size={17} />, label: "数据与隐私" }
];

const adminSections: Array<{ id: SettingsSectionId; icon: ReactNode; label: string }> = [
  { id: "ai", icon: <KeyRound size={17} />, label: "AI 配置" },
  { id: "members", icon: <Users size={17} />, label: "成员管理" },
  { id: "instance", icon: <Server size={17} />, label: "实例状态" }
];

export function SettingsWorkspace() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [me, setMe] = useState<MeStatus | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("profile");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const [nextStatus, nextMe, nextAiSettings] = await Promise.all([fetchSetupStatus(), fetchMe(), fetchAiSettings()]);
      if (cancelled) return;

      setStatus(nextStatus);
      setMe(nextMe);
      setAiSettings(nextAiSettings);

      if (nextMe.account?.role === "ADMIN") {
        setManagedUsers(await fetchUsers());
      }
    }

    void loadStatus()
      .catch((cause) => {
        if (!cancelled) {
          showToast({ message: cause instanceof Error ? cause.message : "无法读取设置", type: "error" });
          setStatus({
            database: "error",
            error: "无法读取实例状态",
            hasAdmin: false,
            initialized: false,
            instanceName: ""
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const isAdmin = me?.account?.role === "ADMIN";
  const sections = useMemo(() => (isAdmin ? [...baseSections, ...adminSections] : baseSections), [isAdmin]);
  const context: SettingsContext = {
    aiSettings,
    loading,
    managedUsers,
    me,
    setAiSettings,
    setManagedUsers,
    setMe,
    setStatus,
    status
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl">
        <div className="moodial-glass rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1 text-sm font-semibold text-[#875cff] shadow-button">
                <Sparkles size={16} /> 我的空间
              </p>
              <h2 className="mt-4 text-4xl font-black text-[#11163d]">管理你的 Moodial 空间</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#777299]">
                这里保留首版真实需要的设置：个人资料、AI 称呼、数据导出、账号删除，以及管理员的模型、成员和实例管理。
              </p>
            </div>
            <div className="rounded-2xl bg-white/60 px-4 py-3 text-sm leading-6 text-[#6f688c] shadow-button">
              {me?.account ? `${me.account.displayName || me.account.username} / ${me.account.role === "ADMIN" ? "管理员" : "普通用户"}` : "正在读取账号"}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition ${
                  activeSection === section.id ? "moodial-button text-white" : "bg-white/70 text-[#6f61a0] shadow-button hover:text-[#875cff]"
                }`}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {loading ? <p className="rounded-[1.5rem] bg-white/60 p-8 text-sm text-[#777299]">正在读取设置...</p> : null}
          {!loading && activeSection === "profile" ? <ProfileSettings context={context} /> : null}
          {!loading && activeSection === "data" ? <DataPrivacySettings /> : null}
          {!loading && isAdmin && activeSection === "ai" ? <AiSettingsPanel context={context} /> : null}
          {!loading && isAdmin && activeSection === "members" ? <UserManagementPanel context={context} /> : null}
          {!loading && isAdmin && activeSection === "instance" ? <InstanceStatusPanel context={context} /> : null}
        </div>
      </section>
    </AppShell>
  );
}
