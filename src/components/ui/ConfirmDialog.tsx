"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  /** Optional extra detail (e.g., "This package has 3 active bookings") */
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap: focus cancel button when dialog opens
  useEffect(() => {
    if (open) {
      cancelBtnRef.current?.focus();
      // Prevent background scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const iconMap = {
    danger: <Trash2 className="h-6 w-6 text-error" />,
    warning: <AlertTriangle className="h-6 w-6 text-warning" />,
    default: <AlertTriangle className="h-6 w-6 text-ink-muted" />,
  };

  const confirmBtnVariant = variant === "danger" ? "secondary" : "primary";
  const confirmBtnClass =
    variant === "danger"
      ? "!bg-error hover:!bg-red-600 !text-white"
      : "";

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onCancel}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative bg-surface rounded-2xl shadow-xl border border-sand/60 max-w-md w-full p-6 animate-[scaleIn_0.2s_ease-out]"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-sand/30 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + content */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 mt-0.5">{iconMap[variant]}</div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-ink">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-sm text-ink-muted mt-1.5 leading-relaxed">
              {description}
            </p>
            {detail && (
              <p className="text-xs font-medium text-warning bg-warning/10 rounded-lg px-3 py-2 mt-3">
                {detail}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            ref={cancelBtnRef}
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmBtnVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
            className={confirmBtnClass}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>

      {/* Inline keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
