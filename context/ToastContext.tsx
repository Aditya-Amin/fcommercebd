"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastState | null>(null);

let nextId = 1;

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
} as const;

const STYLES: Record<ToastVariant, string> = {
  success: "border-success/30 bg-white text-ink",
  error: "border-danger/30 bg-white text-ink",
  info: "border-primary/30 bg-white text-ink"
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-primary"
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId++;
      setToasts((t) => [...t, { id, message, variant }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const value = useMemo<ToastState>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-card animate-slide-up",
                STYLES[t.variant]
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_COLORS[t.variant])} />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-ink-subtle transition hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
