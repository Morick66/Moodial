"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { signInWithUsername } from "@/lib/auth-api";

export function LoginWorkspace() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signInWithUsername({ username, password });
      router.push("/");
      router.refresh();
    } catch (cause) {
      showToast({ message: cause instanceof Error ? cause.message : "登录失败", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-grid px-4 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-gentle backdrop-blur lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-moss">
              <ShieldCheck size={22} />
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">欢迎回来，慢慢来</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-dusk">
              这里是你的自部署日记空间。登录后，记录、列表、日历和设置都会只读取你自己的数据。
            </p>
            <Link className="mt-6 text-sm text-rosewood" href="/setup">
              还没有初始化实例？
            </Link>
          </div>

          <form className="rounded-[1.5rem] bg-white/70 p-5 shadow-gentle" onSubmit={submit}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush text-rosewood">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">登录账号</h2>
                <p className="text-xs text-dusk">默认邀请制，不开放公开注册</p>
              </div>
            </div>

            <div className="grid gap-4">
              <Field label="用户名" onChange={setUsername} value={username} />
              <Field label="密码" onChange={setPassword} type="password" value={password} />
            </div>
            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rosewood px-5 text-sm font-medium text-white shadow-button disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              进入日记本
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
