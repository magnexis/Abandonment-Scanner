import type { BuildingRecord, ReportSummary } from "@shared/index";
import { AlertOctagon, ArrowUpRight, BadgeAlert, Route, ThumbsDown, ThumbsUp } from "lucide-react";
import { api } from "../../api/client";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../hooks/useToast";

export function BuildingDetails({
  building,
  reports,
  onViewImage,
  onRequestRoute,
  onRefresh
}: {
  building: BuildingRecord;
  reports: ReportSummary[];
  onViewImage: (url: string) => void;
  onRequestRoute: () => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const { pushToast } = useToast();

  const handleVote = async (direction: "up" | "down") => {
    try {
      await api.vote(building.id, direction);
      pushToast({
        title: direction === "up" ? "Marked accurate" : "Marked inaccurate",
        description: "Community confidence has been updated."
      });
    } catch (error) {
      pushToast({
        title: "Vote failed",
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  };

  return (
    <Panel className="overflow-hidden">
      <div className="relative">
        <img src={building.imageUrl} alt={building.name} className="h-56 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-200/80">Explorer Mode</p>
              <h2 className="mt-2 font-display text-2xl text-white">{building.name}</h2>
              <p className="mt-1 text-sm text-slate-300">{building.address}</p>
            </div>
            <StatusBadge status={building.status} />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Abandonment Score</p>
            <p className="mt-2 font-display text-3xl text-white">{building.abandonmentScore}%</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Risk Level</p>
            <p className="mt-2 font-display text-3xl text-white">{building.riskLevel}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Reports</p>
            <p className="mt-2 font-display text-3xl text-white">{building.reportsCount}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Confidence</p>
            <p className="mt-2 font-display text-2xl text-white">{building.confidence}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Address</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{building.fullAddress}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onRequestRoute}>
            <Route size={16} className="mr-2" />
            Get Route
          </Button>
          <Button variant="secondary" onClick={() => onViewImage(building.imageUrl)}>
            <ArrowUpRight size={16} className="mr-2" />
            Open Image
          </Button>
          <Button variant="secondary" onClick={onRefresh}>
            Refresh Reports
          </Button>
          <Button variant="ghost" onClick={() => handleVote("up")}>
            <ThumbsUp size={16} className="mr-2" />
            Accurate
          </Button>
          <Button variant="ghost" onClick={() => handleVote("down")}>
            <ThumbsDown size={16} className="mr-2" />
            Inaccurate
          </Button>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="mb-4 flex items-center gap-2 text-slate-100">
            <BadgeAlert size={16} className="text-warning" />
            <h3 className="font-display text-lg">AI Condition Summary</h3>
          </div>
          <p className="text-sm leading-6 text-slate-300">{building.conditionSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {building.factorHighlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs text-emerald-100"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{building.explorerNote}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="mb-4 flex items-center gap-2 text-slate-100">
            <AlertOctagon size={16} className="text-danger" />
            <h3 className="font-display text-lg">Score Breakdown</h3>
          </div>
          <div className="space-y-3">
            {building.factors.map((factor) => (
              <div key={factor.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-200">{factor.label}</span>
                  <span className="font-mono text-success">+{Math.round(factor.impact)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{factor.value}</span>
                  <span>{factor.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <h3 className="font-display text-lg text-slate-100">Recent Reports</h3>
          <div className="mt-4 space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{report.reporter}</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">{report.severity}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{report.summary}</p>
                {report.imageUrl ? (
                  <button className="mt-3 text-xs text-success transition hover:text-green-300" onClick={() => onViewImage(report.imageUrl!)}>
                    Preview image
                  </button>
                ) : null}
              </div>
            ))}
            {!reports.length && <p className="text-sm text-muted">No community reports yet for this property.</p>}
          </div>
        </div>
      </div>
    </Panel>
  );
}
