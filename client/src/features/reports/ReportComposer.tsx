import type React from "react";
import { useEffect, useState } from "react";
import type { BuildingRecord, SignalAnalysis, SignalRecord } from "@shared/index";
import { Radar, UploadCloud } from "lucide-react";
import { api } from "../../api/client";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { useToast } from "../../hooks/useToast";

export function ReportComposer({
  building,
  onSubmitted
}: {
  building: BuildingRecord;
  onSubmitted: () => Promise<void>;
}) {
  const [reporter, setReporter] = useState("");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [confidence, setConfidence] = useState(70);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signalResult, setSignalResult] = useState<{ signal: SignalRecord; analysis: SignalAnalysis } | null>(null);
  const [signalPulse, setSignalPulse] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    if (!signalPulse) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSignalPulse(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [signalPulse]);

  const handleSubmit = async (event: React.FormEvent) => {
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
    } catch (error) {
      pushToast({
        title: "Signal submission failed",
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel className="p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Field Report</p>
        <h3 className="mt-2 font-display text-xl text-white">Submit New Signal</h3>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          value={reporter}
          onChange={(event) => setReporter(event.target.value)}
          className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-muted focus:border-success"
          placeholder="Reporter name"
        />
        <textarea
          required
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-success"
          placeholder="Describe neglect indicators, site condition, or confidence notes"
        />
        <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Confidence</p>
              <p className="mt-1 text-sm text-slate-200">How confident are you in this signal?</p>
            </div>
            <span className="font-mono text-sm text-success">{confidence}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={confidence}
            onChange={(event) => setConfidence(Number(event.target.value))}
            className="mt-4 w-full accent-[#2ea44f]"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as "low" | "medium" | "high")}
            className="rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-white focus:border-success"
          >
            <option value="low">Low severity</option>
            <option value="medium">Medium severity</option>
            <option value="high">High severity</option>
          </select>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-slate-200 transition hover:border-success">
            <UploadCloud size={16} />
            {file ? file.name : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <Button type="submit" disabled={submitting || !summary.trim()} className="w-full">
          {submitting ? "Submitting signal..." : "Submit Signal"}
        </Button>
      </form>
      {signalResult ? (
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-success/25 bg-success/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#7ee787]">Signal Analysis</p>
              <p className="mt-2 font-display text-2xl text-white">{signalResult.analysis.abandonment_score}%</p>
              <p className="mt-1 text-sm capitalize text-slate-200">{signalResult.analysis.risk_level} risk</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">{signalResult.analysis.reasoning}</p>
            </div>
            <div className="relative flex h-14 w-14 items-center justify-center">
              {signalPulse ? (
                <>
                  <span className="absolute inset-0 rounded-full border border-[#2ea44f]/40 animate-radar-pulse" />
                  <span className="absolute inset-[8px] rounded-full border border-[#2ea44f]/30 animate-radar-pulse-delayed" />
                </>
              ) : null}
              <span className="relative z-[1] rounded-full bg-[#2ea44f] p-3 text-white shadow-[0_0_24px_rgba(46,164,79,0.3)]">
                <Radar size={18} />
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
