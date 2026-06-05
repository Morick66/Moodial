"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Database, Inbox, Library, ListFilter, NotebookPen, Settings } from "lucide-react";

const primaryNavItems = [
  { label: "记录", href: "/record", icon: NotebookPen },
  { label: "日记", href: "/entries", icon: Library },
  { label: "日历", href: "/calendar", icon: CalendarDays },
  { label: "设置", href: "/settings", icon: Settings }
];

const disabledNavItems = [
  { label: "收件箱", icon: Inbox },
  { label: "标签", icon: ListFilter },
  { label: "数据", icon: Database }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden px-5 py-6 lg:block">
      <nav aria-label="主导航" className="sticky top-6 flex w-14 flex-col items-center gap-2 rounded-full border border-white/80 bg-white/55 py-3 shadow-gentle backdrop-blur">
        {primaryNavItems.map((item, index) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                active ? "bg-rosewood text-white shadow-button" : "text-dusk hover:bg-blush hover:text-rosewood"
              } ${index === 0 ? "mt-2" : ""}`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <Icon size={20} />
            </Link>
          );
        })}

        <div className="my-2 h-px w-8 bg-rosewood/10" />

        {disabledNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              aria-disabled="true"
              aria-label={`${item.label}，稍后开放`}
              className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full text-rosewood/20"
              disabled
              key={item.label}
              title={`${item.label}，稍后开放`}
              type="button"
            >
              <Icon size={20} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
