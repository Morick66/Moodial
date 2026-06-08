import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "neutral" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        tone === "green" ? "border-[#cfe8d9] bg-[#e9f8ef]/80 text-[#5d806b]" : "border-[#e8ddff] bg-white/72 text-[#756ca0]"
      }`}
    >
      {children}
    </span>
  );
}
