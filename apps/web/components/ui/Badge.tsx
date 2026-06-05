import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "neutral" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
        tone === "green" ? "border-sage bg-sage/70 text-moss" : "border-rosewood/10 bg-paper/80 text-dusk"
      }`}
    >
      {children}
    </span>
  );
}
