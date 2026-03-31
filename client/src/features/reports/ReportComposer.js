import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Radar, UploadCloud } from "lucide-react";
import { api } from "../../api/client";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { useToast } from "../../hooks/useToast";
export function ReportComposer({ building, onSubmitted }) {
    const [reporter, setReporter] = useState("");
    const [summary, setSummary] = useState("");
    const [severity, setSeverity] = useState("medium");
    const [confidence, setConfidence] = useState(70);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [signalResult, setSignalResult] = useState(null);
    const [signalPulse, setSignalPulse] = useState(false);
    const { pushToast } = useToast();
    useEffect(() => {
        if (!signalPulse) {
            return undefined;
        }
        const timeout = window.setTimeout(() => setSignalPulse(false), 1400);
        return () => window.clearTimeout(timeout);
    }, [signalPulse]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await api.submitReport({ buildingId: building.id, reporter, summary, severity, file });
            const signal = await api.submitSignal({
                lat: building.coordinates.lat,
                lng: building.coordinates.lng,
                description: summary,
                confidence
            });
            setSignalResult(signal);
            setSignalPulse(true);
            setSummary("");
            setReporter("");
            setFile(null);
            await onSubmitted();
            pushToast({
                title: "Signal analyzed",
                description: `Stored with a ${signal.analysis.abandonment_score}% abandonment score and ${signal.analysis.risk_level} risk.`
            });
        }
        catch (error) {
            pushToast({
                title: "Signal submission failed",
                description: error instanceof Error ? error.message : "Please try again."
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs(Panel, { className: "p-5", children: [_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Field Report" }), _jsx("h3", { className: "mt-2 font-display text-xl text-white", children: "Submit New Signal" })] }), _jsxs("form", { className: "space-y-4", onSubmit: handleSubmit, children: [_jsx("input", { value: reporter, onChange: (event) => setReporter(event.target.value), className: "w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-muted focus:border-success", placeholder: "Reporter name" }), _jsx("textarea", { required: true, value: summary, onChange: (event) => setSummary(event.target.value), rows: 4, className: "w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-success", placeholder: "Describe neglect indicators, site condition, or confidence notes" }), _jsxs("div", { className: "rounded-2xl border border-white/5 bg-black/20 px-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Confidence" }), _jsx("p", { className: "mt-1 text-sm text-slate-200", children: "How confident are you in this signal?" })] }), _jsxs("span", { className: "font-mono text-sm text-success", children: [confidence, "%"] })] }), _jsx("input", { type: "range", min: 0, max: 100, step: 5, value: confidence, onChange: (event) => setConfidence(Number(event.target.value)), className: "mt-4 w-full accent-[#2ea44f]" })] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_auto]", children: [_jsxs("select", { value: severity, onChange: (event) => setSeverity(event.target.value), className: "rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-white focus:border-success", children: [_jsx("option", { value: "low", children: "Low severity" }), _jsx("option", { value: "medium", children: "Medium severity" }), _jsx("option", { value: "high", children: "High severity" })] }), _jsxs("label", { className: "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-slate-200 transition hover:border-success", children: [_jsx(UploadCloud, { size: 16 }), file ? file.name : "Upload image", _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (event) => setFile(event.target.files?.[0] ?? null) })] })] }), _jsx(Button, { type: "submit", disabled: submitting || !summary.trim(), className: "w-full", children: submitting ? "Submitting signal..." : "Submit Signal" })] }), signalResult ? (_jsx("div", { className: "relative mt-5 overflow-hidden rounded-2xl border border-success/25 bg-success/10 p-4", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-[#7ee787]", children: "Signal Analysis" }), _jsxs("p", { className: "mt-2 font-display text-2xl text-white", children: [signalResult.analysis.abandonment_score, "%"] }), _jsxs("p", { className: "mt-1 text-sm capitalize text-slate-200", children: [signalResult.analysis.risk_level, " risk"] }), _jsx("p", { className: "mt-3 text-sm leading-6 text-slate-200", children: signalResult.analysis.reasoning })] }), _jsxs("div", { className: "relative flex h-14 w-14 items-center justify-center", children: [signalPulse ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "absolute inset-0 rounded-full border border-[#2ea44f]/40 animate-radar-pulse" }), _jsx("span", { className: "absolute inset-[8px] rounded-full border border-[#2ea44f]/30 animate-radar-pulse-delayed" })] })) : null, _jsx("span", { className: "relative z-[1] rounded-full bg-[#2ea44f] p-3 text-white shadow-[0_0_24px_rgba(46,164,79,0.3)]", children: _jsx(Radar, { size: 18 }) })] })] }) })) : null] }));
}
