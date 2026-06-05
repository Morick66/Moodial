"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, KeyRound, Loader2, LogOut, Save, Server, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusPill } from "@/components/ui/StatusPill";
import { fetchAiSettings, saveAiSettings, testAiSettings, type AiSettings } from "@/lib/ai-settings-api";
import { signOut } from "@/lib/auth-api";
import { fetchSetupStatus, type SetupStatus } from "@/lib/setup-api";

type MeStatus = {
  account: {
    displayName: string | null;
    role: "ADMIN" | "USER";
    status: string;
    username: string;
  } | null;
  authenticated: boolean;
};

export function SettingsWorkspace() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [me, setMe] = useState<MeStatus | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiBusy, setAiBusy] = useState<"save" | "test" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const [nextStatus, nextMe, nextAiSettings] = await Promise.all([
        fetchSetupStatus(),
        fetch("/api/me", { cache: "no-store" }).then((response) => response.json() as Promise<MeStatus>),
        fetchAiSettings()
      ]);
      if (!cancelled) setStatus(nextStatus);
      if (!cancelled) setMe(nextMe);
      if (!cancelled) {
        setAiSettings(nextAiSettings);
        setAiBaseUrl(nextAiSettings.baseUrl);
        setAiModel(nextAiSettings.model);
      }
      if (!cancelled) setLoading(false);
    }

    void loadStatus().catch(() => {
      if (!cancelled) {
        setStatus({
          database: "error",
          initialized: false,
          hasAdmin: false,
          instanceName: "",
          error: "无法读取实例状态"
        });
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  async function saveAiConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAiBusy("save");
    setAiMessage("");

    try {
      const nextSettings = await saveAiSettings({
        apiKey: aiKey,
        baseUrl: aiBaseUrl,
        model: aiModel,
        provider: "openai_compatible"
      });
      setAiSettings(nextSettings);
      setAiKey("");
      setAiMessage("AI 配置已保存。");
    } catch (cause) {
      setAiMessage(cause instanceof Error ? cause.message : "保存 AI 配置失败");
    } finally {
      setAiBusy(null);
    }
  }

  async function testAiConfig() {
    setAiBusy("test");
    setAiMessage("");

    try {
      await testAiSettings({
        apiKey: aiKey,
        baseUrl: aiBaseUrl,
        model: aiModel,
        provider: "openai_compatible"
      });
      setAiMessage("AI 连接测试成功。");
    } catch (cause) {
      setAiMessage(cause instanceof Error ? cause.message : "AI 连接测试失败");
    } finally {
      setAiBusy(null);
    }
  }

  const isAdmin = me?.account?.role === "ADMIN";

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/80 bg-white/60 p-6 shadow-gentle backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-dusk">实例设置</p>
            <h2 className="mt-1 text-3xl font-semibold">把数据留在自己手里</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-dusk">当前已经接入多用户账号。日记、日历和列表会按登录用户隔离保存，AI Key 和订阅配置会在后续阶段接入。</p>
          </div>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/70 px-4 text-sm text-rosewood shadow-button" onClick={logout} type="button">
            <LogOut size={17} />
            登出
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusPill icon={<Server size={17} />} label="数据库" value={loading ? "检查中" : status?.database === "connected" ? "已连接" : "不可用"} />
          <StatusPill icon={<Users size={17} />} label="初始化" value={status?.initialized ? "已完成" : "未完成"} />
          <StatusPill icon={<KeyRound size={17} />} label="AI Key" value={aiSettings?.configured ? "已配置" : "待配置"} />
          <StatusPill icon={<Download size={17} />} label="导出" value="本地保存" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] bg-paper/70 p-4">
            <h3 className="font-medium">实例信息</h3>
            <p className="mt-2 text-sm leading-6 text-dusk">实例名称：{status?.instanceName || "尚未设置"}。Docker 自部署、NAS 和云服务器部署会作为第一优先级。</p>
          </article>
          <article className="rounded-[1.5rem] bg-paper/70 p-4">
            <div className="flex items-center gap-2">
              <UserRound size={18} />
              <h3 className="font-medium">当前账号</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-dusk">
              {me?.account ? `${me.account.displayName || me.account.username} / ${me.account.role === "ADMIN" ? "管理员" : "普通用户"} / ${me.account.status}` : "正在读取账号状态..."}
            </p>
          </article>
          <article className="rounded-[1.5rem] bg-paper/70 p-4">
            <h3 className="font-medium">AI 配置</h3>
            <p className="mt-2 text-sm leading-6 text-dusk">
              {aiSettings?.configured ? `已配置 ${aiSettings.model}。聊天和整理会优先使用真实模型。` : "未配置时会继续使用本地原型回复，记录流程不会中断。"}
            </p>
          </article>
          <article className="rounded-[1.5rem] bg-paper/70 p-4">
            <h3 className="font-medium">账号与隐私</h3>
            <p className="mt-2 text-sm leading-6 text-dusk">当前已有管理员：{status?.hasAdmin ? "是" : "否"}。新增用户接口已预留为邀请制，普通用户不能创建账号。</p>
          </article>
        </div>

        <form className="mt-6 rounded-[1.5rem] border border-white/80 bg-paper/70 p-5" onSubmit={saveAiConfig}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <h3 className="font-medium">AI 模型配置</h3>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-dusk">第一版支持 OpenAI-Compatible Chat Completions。API Key 只保存在服务端，并会加密写入数据库。</p>
            </div>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-dusk">Provider: OpenAI-Compatible</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Field disabled={!isAdmin} label="Base URL" onChange={setAiBaseUrl} placeholder="https://api.openai.com/v1" value={aiBaseUrl} />
            <Field disabled={!isAdmin} label="Model" onChange={setAiModel} placeholder="gpt-4o-mini" value={aiModel} />
            <Field
              disabled={!isAdmin}
              label={aiSettings?.hasApiKey ? "API Key（留空则不修改）" : "API Key"}
              onChange={setAiKey}
              placeholder={aiSettings?.hasApiKey ? "已保存，输入新 Key 可替换" : "sk-..."}
              type="password"
              value={aiKey}
            />
          </div>

          {aiMessage ? <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm text-dusk">{aiMessage}</p> : null}
          {!isAdmin ? <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-clay">只有管理员可以修改实例级 AI 配置。</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-rosewood px-4 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isAdmin || Boolean(aiBusy)}
              type="submit"
            >
              {aiBusy === "save" ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              保存配置
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-sm text-rosewood shadow-button disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isAdmin || Boolean(aiBusy) || !aiSettings?.configured}
              onClick={testAiConfig}
              type="button"
            >
              {aiBusy === "test" ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              测试当前填写
            </button>
          </div>
        </form>

        <div className={`mt-6 rounded-[1.5rem] border p-4 ${status?.database === "error" ? "border-blush bg-blush/60" : "border-sage bg-sage/50"}`}>
          <div className="flex items-start gap-3">
            <ShieldCheck className={`mt-0.5 shrink-0 ${status?.database === "error" ? "text-rosewood" : "text-moss"}`} size={20} />
            <p className={`text-sm leading-6 ${status?.database === "error" ? "text-rosewood" : "text-moss"}`}>
              {status?.database === "error" ? status.error ?? "数据库暂不可用，请检查 DATABASE_URL 和 PostgreSQL 服务。" : "当前日记保存已经走 API + 数据库 + 登录用户隔离。未登录请求日记 API 会返回 401。"}
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Field({
  disabled,
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "password" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-dusk">
      {label}
      <input
        className="h-11 rounded-2xl border border-white/80 bg-white/80 px-4 text-ink outline-none transition focus:border-rosewood/30 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
