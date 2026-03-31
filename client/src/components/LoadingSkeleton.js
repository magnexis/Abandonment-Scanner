import { jsx as _jsx } from "react/jsx-runtime";
export function LoadingSkeleton({ className = "h-24" }) {
    return _jsx("div", { className: `animate-pulse-soft rounded-2xl bg-white/5 ${className}` });
}
