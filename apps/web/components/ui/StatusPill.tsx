import type { ReactNode } from "react";

export function StatusPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-40 items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-3 py-2 shadow-button">
      <span className="text-dusk">{icon}</span>
      <div>
        <p className="text-xs text-dusk">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
