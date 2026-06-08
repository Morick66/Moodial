"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Download, LogOut, Settings, Sparkles, Sun, Wifi } from "lucide-react";
import { AvatarView } from "@/components/avatar/AvatarView";
import { signOut } from "@/lib/auth-api";
import type { UserAvatarPreference } from "@/lib/me-api";

type MeStatus = {
  account: {
    displayName: string | null;
    role: "ADMIN" | "USER";
    status: string;
    username: string;
  } | null;
  authenticated: boolean;
  preferences: {
    aiDisplayName: string;
    avatar: UserAvatarPreference;
  };
};

export function TopBar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const [me, setMe] = useState<MeStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [todayText] = useState(() =>
    new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(new Date())
  );

  const loadMe = useCallback(async () => {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) return;
    setMe((await response.json()) as MeStatus);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMe() {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!response.ok) return;
      const nextMe = (await response.json()) as MeStatus;
      if (!cancelled) setMe(nextMe);
    }

    void loadInitialMe();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.addEventListener("moodial:me-updated", loadMe);
    return () => window.removeEventListener("moodial:me-updated", loadMe);
  }, [loadMe]);

  useEffect(() => {
    if (!menuOpen && !noticeOpen) return;

    function closeOnOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
      if (!noticeRef.current?.contains(event.target as Node)) setNoticeOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Escape") setNoticeOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, noticeOpen]);

  const displayName = me?.account?.displayName || me?.account?.username || "Moodial";
  const username = me?.account?.username ?? "moodial";
  const roleLabel = me?.account?.role === "ADMIN" ? "管理员" : "普通用户";

  async function logout() {
    setSigningOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Link className="flex items-center gap-3 rounded-2xl outline-none transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#8d64ff]/30 lg:hidden" href="/" aria-label="回到首页">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b4dff] via-[#b96cff] to-[#ff9fc8] text-white shadow-button">
          <Sparkles aria-hidden="true" size={21} />
        </span>
        <span>
          <span className="block text-xl font-semibold text-[#11163d]">Moodial</span>
          <span className="block text-xs text-[#7d7297]">今日心情空间</span>
        </span>
      </Link>
      <div className="hidden items-center gap-3 text-sm text-[#1a1f48] lg:flex">
        <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white/58 px-4 shadow-button">
          <Sun className="text-[#ffb72b]" size={20} />
          <span>24°C</span>
          <span className="text-[#7d7297]">晴</span>
        </span>
        <span className="text-base font-medium">{todayText || "今天"}</span>
      </div>

      <div className="flex items-center gap-3 text-ink">
        <div className="relative" ref={noticeRef}>
          <button
            aria-expanded={noticeOpen}
            aria-haspopup="menu"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/62 text-[#4d4674] shadow-button transition hover:bg-white"
            onClick={() => setNoticeOpen((current) => !current)}
            title="通知"
            type="button"
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ff3c64]" />
          </button>
          {noticeOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-80 rounded-[1.25rem] border border-white/90 bg-white/95 p-3 text-left shadow-soft backdrop-blur" role="menu">
              <p className="px-2 pb-2 text-sm font-semibold text-[#11163d]">提醒</p>
              <NotificationItem href="/settings" title="检查 AI 配置" body="如果希望使用真实模型回复，可以在设置里保存并测试 API Key。" />
              <NotificationItem href="/entries" title="记得备份" body="日记是私密数据，定期导出 JSON 或 Markdown 会更安心。" />
              <NotificationItem href="/record" title="今天也可以很短" body="一句话也能成为今天的记录，不需要写完整。" />
            </div>
          ) : null}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="打开账号菜单"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white/75 text-sm font-semibold text-[#7b4dff] shadow-button transition hover:bg-white"
            onClick={() => setMenuOpen((current) => !current)}
            title="账号菜单"
            type="button"
          >
            <AvatarView avatar={me?.preferences.avatar} fallbackName={displayName} size="md" />
          </button>

          {menuOpen ? (
            <div
              className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-72 rounded-[1.25rem] border border-white/90 bg-white/95 p-3 text-left shadow-soft backdrop-blur"
              role="menu"
            >
              <div className="flex items-center gap-3 rounded-2xl bg-paper/70 p-3">
                <AvatarView avatar={me?.preferences.avatar} fallbackName={displayName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-dusk">
                    @{username} / {roleLabel}
                  </p>
                </div>
              </div>

              <div className="mt-2 grid gap-1">
                <MenuLink href="/settings" icon={<Settings size={17} />} label="设置" onClick={() => setMenuOpen(false)} />
                <MenuLink href="/api/export/json" icon={<Download size={17} />} label="导出 JSON" onClick={() => setMenuOpen(false)} />
                <MenuLink href="/api/export/markdown" icon={<Download size={17} />} label="导出 Markdown" onClick={() => setMenuOpen(false)} />
              </div>

              <div className="my-2 h-px bg-rosewood/10" />

              <button
                className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-rosewood transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-60"
                disabled={signingOut}
                onClick={logout}
                role="menuitem"
                type="button"
              >
                <LogOut size={17} />
                {signingOut ? "正在登出" : "登出"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({ body, href, title }: { body: string; href: string; title: string }) {
  return (
    <Link className="block rounded-2xl px-3 py-2 transition hover:bg-[#f4edff]" href={href}>
      <p className="text-sm font-medium text-[#272a51]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#81799d]">{body}</p>
    </Link>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink transition hover:bg-sage/55" href={href} onClick={onClick} role="menuitem">
      {icon}
      {label}
    </Link>
  );
}
