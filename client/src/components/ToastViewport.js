import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { useToast } from "../hooks/useToast";
export function ToastViewport() {
    const { toasts, removeToast } = useToast();
    return (_jsx("div", { className: "pointer-events-none fixed bottom-4 right-4 z-50 flex w-[320px] flex-col gap-3", children: toasts.map((toast) => (_jsx("div", { className: "pointer-events-auto animate-fade-up rounded-2xl border border-border bg-panel px-4 py-3 shadow-panel", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-100", children: toast.title }), toast.description ? _jsx("p", { className: "mt-1 text-xs text-muted", children: toast.description }) : null] }), _jsx("button", { onClick: () => removeToast(toast.id), className: "text-muted transition hover:text-white", children: _jsx(X, { size: 14 }) })] }) }, toast.id))) }));
}
