"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

interface ShowToastOptions {
  variant?: ToastVariant;
  /** ms before auto-dismiss; pass 0 to keep it until the user closes it. */
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 2600;
const EXIT_ANIMATION_MS = 200;

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; bg: string; icon: typeof CheckCircle2 }
> = {
  // Success ("added") uses the brand's tealish primary, kept very subtle.
  success: { border: "border-primary/20", bg: "bg-tint-blue", icon: CheckCircle2 },
  error: { border: "border-accent-red/20", bg: "bg-tint-red", icon: AlertCircle },
  info: { border: "border-border", bg: "bg-white", icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const clearTimers = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setVisible(false);
    unmountTimer.current = setTimeout(() => setToast(null), EXIT_ANIMATION_MS);
  }, [clearTimers]);

  const showToast = useCallback(
    (message: string, options: ShowToastOptions = {}) => {
      clearTimers();
      const id = ++nextId.current;
      setToast({
        id,
        message,
        variant: options.variant ?? "info",
        action: options.action,
      });
      // Re-trigger the fade-in even when a toast is already on screen: drop
      // to invisible first, then flip back after paint so the transition
      // actually runs instead of being a no-op class change.
      setVisible(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));

      const duration = options.duration ?? DEFAULT_DURATION_MS;
      if (duration > 0) {
        dismissTimer.current = setTimeout(() => {
          setVisible(false);
          unmountTimer.current = setTimeout(
            () => setToast((current) => (current?.id === id ? null : current)),
            EXIT_ANIMATION_MS,
          );
        }, duration);
      }
    },
    [clearTimers],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
      >
        {toast && <ToastCard toast={toast} visible={visible} onDismiss={dismiss} />}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  visible,
  onDismiss,
}: {
  toast: ToastState;
  visible: boolean;
  onDismiss: () => void;
}) {
  const style = VARIANT_STYLES[toast.variant];
  const Icon = style.icon;

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm min-w-0 items-center gap-2.5 rounded-2xl border ${style.border} ${style.bg} px-4 py-3 shadow-lg shadow-navy/5 transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <Icon className="h-4.5 w-4.5 shrink-0 text-navy" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-medium break-words text-navy">{toast.message}</p>
      {toast.action &&
        (toast.action.href ? (
          <Link
            href={toast.action.href}
            onClick={toast.action.onClick}
            className="shrink-0 text-sm font-semibold text-primary underline underline-offset-2"
          >
            {toast.action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="shrink-0 text-sm font-semibold text-primary underline underline-offset-2"
          >
            {toast.action.label}
          </button>
        ))}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="بستن پیام"
        className="shrink-0 text-secondary-text transition-colors hover:text-navy"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
