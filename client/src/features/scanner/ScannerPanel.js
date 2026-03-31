import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Crosshair, Search, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { RadiusControl } from "./RadiusControl";
export function ScannerPanel({ query, onQueryChange, onScan, onUseSuggestion, nearby, scanning, scanMessage, selectedLocation, radiusMeters, onRadiusChange }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const deferredQuery = useDeferredValue(query);
    useEffect(() => {
        if (!deferredQuery.trim()) {
            setSuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        const timeout = window.setTimeout(() => {
            startTransition(() => {
                api
                    .search(deferredQuery)
                    .then(setSuggestions)
                    .finally(() => setLoadingSuggestions(false));
            });
        }, 180);
        return () => window.clearTimeout(timeout);
    }, [deferredQuery]);
    return (_jsxs(Panel, { className: "p-5 hover:border-success/25 hover:shadow-[0_0_28px_rgba(46,164,79,0.1)]", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Smart Scanner" }), _jsx("h2", { className: "mt-2 font-display text-2xl text-white", children: "Scan Address Or Click Map" }), _jsx("p", { className: "mt-2 text-sm text-muted", children: "Search by name or address, or drop a scan point directly on the map for a simulation-backed readout." })] }), _jsx("span", { className: "rounded-2xl border border-success/20 bg-success/10 p-3 text-success", children: _jsx(Sparkles, { size: 18 }) })] }), _jsxs("div", { className: "mt-5 space-y-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted", size: 16 }), _jsx("input", { value: query, onChange: (event) => onQueryChange(event.target.value), onKeyDown: (event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void onScan();
                                    }
                                }, placeholder: "Search address, city, or building", className: "w-full rounded-xl border border-border bg-black/20 px-11 py-3 text-sm text-white placeholder:text-muted transition-all duration-200 focus:border-success focus:outline-none focus:shadow-[0_0_0_4px_rgba(46,164,79,0.12)]" })] }), (suggestions.length > 0 || loadingSuggestions) && (_jsx("div", { className: "overflow-hidden rounded-2xl border border-border bg-black/20", children: loadingSuggestions ? (_jsx("p", { className: "px-4 py-3 text-sm text-muted", children: "Searching nearby matches..." })) : (suggestions.map((suggestion) => (_jsxs("button", { onClick: () => onUseSuggestion(suggestion), className: "flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] hover:bg-white/5 last:border-b-0 active:scale-[0.99]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: suggestion.label }), _jsx("p", { className: "text-xs text-muted", children: suggestion.subtitle })] }), _jsx(Crosshair, { size: 14, className: "text-muted" })] }, suggestion.id)))) })), _jsx(RadiusControl, { value: radiusMeters, onChange: onRadiusChange }), _jsx(Button, { onClick: onScan, className: "w-full", disabled: scanning, children: scanning ? "Scanning..." : "Run Abandonment Scan" }), _jsxs("div", { className: "rounded-2xl border border-white/5 bg-black/20 px-4 py-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Live Scan Status" }), _jsx("p", { className: "mt-2 text-sm text-slate-200", children: scanning ? scanMessage : "Ready for the next map click or search scan." }), selectedLocation ? (_jsx("p", { className: "mt-2 text-xs text-muted", children: selectedLocation.fullAddress })) : null] })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Radius Scan Results" }), _jsxs("span", { className: "text-xs text-muted", children: [nearby.length, " candidates"] })] }), _jsxs("div", { className: "space-y-3", children: [nearby.map((building) => (_jsx("div", { className: "rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-success/30 hover:bg-black/30 hover:shadow-[0_0_24px_rgba(46,164,79,0.12)]", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: building.name }), _jsx("p", { className: "text-xs text-muted", children: building.address })] }), _jsxs("span", { className: "font-mono text-sm text-success", children: [building.abandonmentScore, "%"] })] }) }, building.id))), !nearby.length && _jsx("p", { className: "text-sm text-muted", children: "Run a radius scan to populate candidates around the selected point." })] })] })] }));
}
