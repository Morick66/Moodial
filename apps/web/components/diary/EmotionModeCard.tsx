import type { EmotionModeDefinition } from "@jzmle/core";
import { ChevronRight } from "lucide-react";

export function EmotionModeCard({ mode, onSelect }: { mode: EmotionModeDefinition; onSelect: () => void }) {
  return (
    <button
      className="group min-h-[150px] rounded-[1.6rem] border border-black/5 bg-white/70 p-5 text-left shadow-gentle backdrop-blur transition hover:-translate-y-1 hover:bg-white"
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-lg text-rosewood shadow-button">{mode.symbol}</span>
        <ChevronRight className="text-dusk transition group-hover:translate-x-1" size={18} />
      </div>
      <h3 className="mt-4 font-semibold">{mode.label}</h3>
      <p className="mt-2 text-sm leading-6 text-dusk">{mode.description}</p>
    </button>
  );
}
