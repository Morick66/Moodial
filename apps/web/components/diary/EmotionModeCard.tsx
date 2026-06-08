import type { EmotionModeDefinition } from "@jzmle/core";
import { ChevronRight } from "lucide-react";

const modeVisuals: Record<string, { emoji: string; tone: string; title: string }> = {
  happy: { emoji: "🙂", tone: "from-[#fff3d8] to-[#ffe0a8]", title: "开心" },
  angry: { emoji: "😡", tone: "from-[#ffe4dd] to-[#ffb7a1]", title: "烦躁" },
  sad: { emoji: "☹️", tone: "from-[#e7efff] to-[#cfe0ff]", title: "难过" },
  messy: { emoji: "😶", tone: "from-[#efe7ff] to-[#d9c5ff]", title: "脑子很乱" }
};

export function EmotionModeCard({ mode, onSelect }: { mode: EmotionModeDefinition; onSelect: () => void }) {
  const visual = modeVisuals[mode.id] ?? { emoji: mode.symbol, tone: "from-white to-[#f1eaff]", title: mode.label };

  return (
    <button
      className="group min-h-[180px] rounded-[1.6rem] border border-white/75 bg-white/62 p-5 text-left shadow-gentle backdrop-blur transition hover:-translate-y-1 hover:bg-white"
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${visual.tone} text-4xl shadow-button`}>{visual.emoji}</span>
        <ChevronRight className="text-[#8b80a7] transition group-hover:translate-x-1" size={18} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#11163d]">{visual.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#7f789d]">{mode.description}</p>
    </button>
  );
}
