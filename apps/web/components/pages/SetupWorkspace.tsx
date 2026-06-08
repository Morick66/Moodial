"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Database, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { initializeInstance, fetchSetupStatus, type SetupStatus } from "@/lib/setup-api";

export function SetupWorkspace() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [instanceName, setInstanceName] = useState("Moodial");
  const [username, setUsername] = useState("admin");
  const [displayName, setDisplayName] = useState("管理员");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const nextStatus = await fetchSetupStatus();
      if (cancelled) return;
      setStatus(nextStatus);
      if (nextStatus.instanceName) setInstanceName(nextStatus.instanceName);
      setLoading(false);
    }

    void loadStatus().catch((cause) => {
      if (!cancelled) {
        showToast({ message: cause instanceof Error ? cause.message : "无法读取初始化状态", type: "error" });
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const nextStatus = await initializeInstance({
        instanceName,
        username,
        displayName,
        password
      });
      setStatus(nextStatus);
      router.push("/login");
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "初始化失败", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-grid px-4 py-8 text-ink">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-gentle backdrop-blur sm:p-10">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-rosewood">
              <ShieldCheck size={22} />
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">先把这本日记本交到你手里</h1>
            <p className="mt-4 text-sm leading-7 text-dusk">
              初始化只做最少的事：创建第一个管理员账号，并给这个自部署实例起一个名字。之后所有日记都会按登录用户隔离保存。
            </p>
            <div className="mt-6 rounded-[1.5rem] bg-sage/50 p-4 text-sm leading-7 text-moss">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Database size={17} />
                数据库状态
              </div>
              {loading ? "正在检查..." : status?.database === "connected" ? "已连接 PostgreSQL" : "数据库暂不可用"}
            </div>
          </div>

          <form className="rounded-[1.5rem] bg-white/70 p-5 shadow-gentle" onSubmit={submit}>
            <div className="grid gap-4">
              <Field label="实例名称" onChange={setInstanceName} value={instanceName} />
              <Field label="管理员用户名" onChange={setUsername} value={username} />
              <Field label="显示名称" onChange={setDisplayName} value={displayName} />
              <Field label="管理员密码" onChange={setPassword} type="password" value={password} />
            </div>

            {status?.initialized ? <p className="mt-4 rounded-2xl bg-sage/70 px-4 py-3 text-sm text-moss">实例已经初始化，请用管理员账号登录。</p> : null}

            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rosewood px-5 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || loading || status?.database === "error" || status?.initialized}
              type="submit"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              {status?.initialized ? "已经初始化" : "完成初始化"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "password" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-dusk">
      {label}
      <input
        className="h-12 rounded-2xl border border-white/80 bg-paper/70 px-4 text-ink outline-none focus:border-rosewood/30"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}
