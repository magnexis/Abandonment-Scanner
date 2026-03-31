import { Activity, AlertTriangle, Building2, Flame, Radar, Search, type LucideIcon } from "lucide-react";
import type { DashboardStats } from "@shared/index";
import { Panel } from "../../components/Panel";

type DashboardStatKey = "totalBuildings" | "averageScore" | "recentScans" | "reportsToday";

type DashboardStatItem = {
  key: DashboardStatKey;
  label: string;
  icon: LucideIcon;
  suffix?: string;
};

const items: DashboardStatItem[] = [
  { key: "totalBuildings", label: "Tracked Buildings", icon: Building2 },
  { key: "averageScore", label: "Average Score", icon: Radar, suffix: "%" },
  { key: "recentScans", label: "Recent Scans", icon: Activity },
  { key: "reportsToday", label: "Reports (24h)", icon: AlertTriangle }
];

export function DashboardStats({
  stats,
  activeAnimation,
  onCardClick
}: {
  stats: DashboardStats;
  activeAnimation: string | null;
  onCardClick: (key: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];
        const isActive = activeAnimation === item.key;

        const overlay =
          item.key === "totalBuildings" ? (
            <div className="animate-pop text-[#58a6ff]">
              <Search size={34} />
            </div>
          ) : item.key === "averageScore" ? (
            <div className="animate-pop text-[#f85149]">
              <Flame size={34} />
            </div>
          ) : item.key === "recentScans" ? (
            <div className="relative h-20 w-20 animate-pop">
              <div className="absolute inset-0 rounded-full border border-[#2ea44f]/45 animate-radar-pulse" />
              <div className="absolute inset-[12px] rounded-full border border-[#2ea44f]/30 animate-radar-pulse-delayed" />
              <div className="absolute left-1/2 top-1/2 h-[2px] w-9 origin-left -translate-y-1/2 bg-gradient-to-r from-[#7ee787] to-transparent animate-radar-sweep" />
              <div className="absolute inset-[30px] rounded-full bg-[#2ea44f]" />
            </div>
          ) : (
            <div className="animate-pop text-[#d29922]">
              <AlertTriangle size={34} />
            </div>
          );

        return (
          <Panel
            key={item.key}
            onClick={() => onCardClick(item.key)}
            className={`
              relative flex min-h-[148px] cursor-pointer items-center justify-center overflow-hidden p-5
              hover:-translate-y-1 hover:scale-[1.02] hover:border-success/40 hover:shadow-[0_0_28px_rgba(46,164,79,0.18)] active:scale-[0.99]
              ${isActive ? "border-success/40 shadow-[0_0_30px_rgba(46,164,79,0.18)]" : ""}
            `}
          >
            {isActive ? <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{overlay}</div> : null}

            <div className="relative z-[1] flex w-full items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted">{item.label}</p>
                <p className="mt-3 font-display text-3xl text-white">
                  {value}
                  {item.suffix ?? ""}
                </p>
              </div>
              <span className="rounded-2xl border border-white/10 bg-white/5 p-3 text-success transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(46,164,79,0.18)]">
                <Icon size={18} />
              </span>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
