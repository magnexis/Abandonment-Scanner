import { jsx as _jsx } from "react/jsx-runtime";
import clsx from "clsx";
export function StatusBadge({ status }) {
    return (_jsx("span", { className: clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", status === "Likely Abandoned" && "border-danger/40 bg-danger/15 text-red-200", status === "Suspicious" && "border-warning/40 bg-warning/15 text-amber-100", status === "Active" && "border-success/40 bg-success/15 text-emerald-100"), children: status }));
}
