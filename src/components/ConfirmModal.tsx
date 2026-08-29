"use client";

import { Loader2, X } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl p-6 shadow-2xl bg-card border border-border dark:bg-[#0d0d14] dark:border-white/9"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white/90">
            {title}
          </p>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors text-muted-foreground hover:text-foreground hover:bg-accent dark:text-white/30 dark:hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm mb-5 text-muted-foreground dark:text-white/50">
          {message}
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-xs font-medium transition-colors border border-border text-muted-foreground hover:text-foreground hover:bg-accent dark:border-white/10 dark:text-white/40 dark:hover:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-red-500/15 dark:border dark:border-red-500/30 dark:text-red-400/90 dark:hover:bg-red-500/25 dark:hover:border-red-500/50 dark:hover:text-red-400"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
