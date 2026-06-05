import Link from "next/link";
import { Languages, Monitor, Palette, Wifi } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between px-5 sm:px-7">
      <Link className="flex items-center gap-3 rounded-2xl outline-none transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-rosewood/30" href="/" aria-label="回到首页">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rosewood text-white shadow-button">
          <Wifi aria-hidden="true" size={21} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Moodial</h1>
          <p className="text-xs text-dusk">把今天轻轻放下来</p>
        </div>
      </Link>
      <div className="flex items-center gap-3 text-ink">
        <IconButton disabled label="显示设置，稍后开放">
          <Monitor size={20} />
        </IconButton>
        <IconButton disabled label="主题，稍后开放">
          <Palette size={20} />
        </IconButton>
        <IconButton disabled label="语言，稍后开放">
          <Languages size={20} />
        </IconButton>
        <button
          aria-disabled="true"
          className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-full border border-white bg-white/70 text-sm text-dusk opacity-70 shadow-button"
          disabled
          title="账号菜单稍后开放"
          type="button"
        >
          M
        </button>
      </div>
    </header>
  );
}
