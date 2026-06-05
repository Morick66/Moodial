import type { ReactNode } from "react";

export function IconButton({ children, disabled = false, label, onClick }: { children: ReactNode; disabled?: boolean; label: string; onClick?: () => void }) {
  return (
    <button
      aria-disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-dusk transition enabled:hover:bg-blush enabled:hover:text-rosewood disabled:cursor-not-allowed disabled:opacity-35"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
