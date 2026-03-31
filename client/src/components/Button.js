import { jsx as _jsx } from "react/jsx-runtime";
import clsx from "clsx";
export function Button({ className, variant = "primary", ...props }) {
    return (_jsx("button", { ...props, className: clsx("inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]", variant === "primary" &&
            "border-success bg-success text-white shadow-lg shadow-green-900/20 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-green-500 hover:shadow-[0_0_28px_rgba(46,164,79,0.35)]", variant === "secondary" &&
            "border-border bg-white/5 text-slate-100 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-success/40 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(46,164,79,0.12)]", variant === "ghost" && "border-transparent bg-transparent text-slate-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/5", className) }));
}
