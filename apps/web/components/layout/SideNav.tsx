"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarCheck, Home, Library, MessageCircle, NotebookPen, Settings, Sparkles, TrendingUp } from "lucide-react";

const primaryNavItems = [
  { label: "今日", href: "/", icon: Home },
  { label: "日记本", href: "/entries", icon: Library },
  { label: "情绪日历", href: "/calendar", icon: CalendarCheck },
  { label: "AI 聊天", href: "/record", icon: MessageCircle },
  { label: "回顾与洞察", href: "/insights", icon: NotebookPen },
  { label: "情绪分析", href: "/analysis", icon: BarChart3 },
  { label: "设置", href: "/settings", icon: Settings }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-0 border-r border-white/55 bg-gradient-to-b from-white/76 via-[#f4ecff]/74 to-[#efe3ff]/78 px-5 py-6 lg:flex lg:flex-col">
      <Link className="flex items-center gap-3 rounded-[1.35rem] outline-none transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#8d64ff]/30" href="/" aria-label="回到今日">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[#7b4dff] via-[#b96cff] to-[#ff9fc8] text-white shadow-button">
          <Sparkles size={23} />
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#ffb4ca]" />
        </span>
        <span>
          <span className="block text-2xl font-semibold tracking-[0.01em] text-[#11163d]">Moodial</span>
          <span className="block text-xs text-[#7d7297]">把今天轻轻放下</span>
        </span>
      </Link>

      <nav aria-label="主导航" className="mt-9 grid gap-3">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-[#7b4dff] to-[#c987ff] text-white shadow-[0_14px_30px_rgba(128,78,255,0.24)]"
                  : "text-[#22284f] hover:bg-white/72 hover:text-[#7b4dff]"
              }`}
              href={item.href}
              key={item.label}
              title={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/50 p-4 shadow-gentle">
        <div className="mx-auto mb-3 flex h-24 items-end justify-center">
          <span className="moodial-mascot scale-75" aria-hidden="true" />
        </div>
        <Link className="flex w-full items-center justify-between rounded-2xl bg-white/72 px-3 py-3 text-sm font-medium text-[#6f61a0] shadow-button" href="/settings">
          <span>我的空间</span>
          <TrendingUp size={16} />
        </Link>
      </div>
    </aside>
  );
}
