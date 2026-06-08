"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastType = "error" | "info" | "success";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (toast: { message: string; type?: ToastType }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = "info" }: { message: string; type?: ToastType }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current.slice(-2), { id, message, type }]);
      window.setTimeout(() => removeToast(id), type === "error" ? 5200 : 3600);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            className={`pointer-events-auto flex max-w-[min(92vw,34rem)] items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft backdrop-blur ${
              toast.type === "success"
                ? "border-sage bg-white/95 text-moss"
                : toast.type === "error"
                  ? "border-blush bg-white/95 text-rosewood"
                  : "border-white/90 bg-white/95 text-dusk"
            }`}
            key={toast.id}
            role="status"
          >
            {toast.type === "success" ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : null}
            {toast.type === "error" ? <XCircle className="mt-0.5 shrink-0" size={18} /> : null}
            {toast.type === "info" ? <Info className="mt-0.5 shrink-0" size={18} /> : null}
            <p className="leading-6">{toast.message}</p>
            <button className="ml-2 rounded-full p-1 opacity-70 transition hover:bg-blush hover:opacity-100" onClick={() => removeToast(toast.id)} type="button">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
