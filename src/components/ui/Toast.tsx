"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/* ─── Context ─────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ─── Styles per variant ──────────────────────────────────── */

const variantStyles: Record<ToastVariant, { bg: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: { bg: "bg-success/10 border-success/30", icon: CheckCircle, iconColor: "text-success" },
  error: { bg: "bg-error/10 border-error/30", icon: XCircle, iconColor: "text-error" },
  warning: { bg: "bg-warning/10 border-warning/30", icon: AlertTriangle, iconColor: "text-warning" },
  info: { bg: "bg-sky/10 border-sky/30", icon: Info, iconColor: "text-sky" },
};

/* ─── Provider + Renderer ─────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration: number = 4000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]);

      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast(msg, "success", 3000),
    error: (msg) => addToast(msg, "error", 6000),
    warning: (msg) => addToast(msg, "warning", 5000),
    info: (msg) => addToast(msg, "info", 4000),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container — bottom-right on desktop, bottom-center on mobile */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const style = variantStyles[t.variant];
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`
                pointer-events-auto
                flex items-start gap-3 px-4 py-3
                rounded-xl border shadow-lg
                ${style.bg}
                animate-[slideUp_0.25s_ease-out]
                backdrop-blur-sm
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
              <p className="text-sm font-medium text-ink flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-0.5 rounded-md text-ink-muted hover:text-ink transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline keyframes for slide-up animation */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
