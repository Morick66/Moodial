import type { ReactNode } from "react";

export function MetricBox({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-paper p-3">
      <div className="flex items-center justify-between text-xs text-dusk">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}
