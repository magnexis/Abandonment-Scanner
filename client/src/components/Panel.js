import { jsx as _jsx } from "react/jsx-runtime";
import clsx from "clsx";
export function Panel({ className, children, ...props }) {
    return (_jsx("section", { ...props, className: clsx("rounded-2xl border border-border bg-panel/90 shadow-panel backdrop-blur transition-all duration-200", className), children: children }));
}
