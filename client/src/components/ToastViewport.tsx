import { X } from "lucide-react";
import { useToast } from "../hooks/useToast";

export function ToastViewport() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[320px] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-fade-up rounded-2xl border border-border bg-panel px-4 py-3 shadow-panel"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-xs text-muted">{toast.description}</p> : null}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-muted transition hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

