import type { ReactNode } from "react";

export function SettingsCard({
  children,
  description,
  icon,
  title
}: {
  children: ReactNode;
  description?: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/80 bg-paper/70 p-5">
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 text-rosewood">{icon}</div> : null}
        <div>
          <h3 className="font-medium">{title}</h3>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-dusk">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SettingsField({
  disabled,
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "password" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-dusk">
      {label}
      <input
        className="h-11 rounded-2xl border border-white/80 bg-white/80 px-4 text-ink outline-none transition focus:border-rosewood/30 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
