import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { BuildingRecord, ResolvedLocation, SearchSuggestion } from "@shared/index";
import { Crosshair, Search, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { RadiusControl } from "./RadiusControl";

export function ScannerPanel({
  query,
  onQueryChange,
  onScan,
  onUseSuggestion,
  nearby,
  scanning,
  scanMessage,
  selectedLocation,
  radiusMeters,
  onRadiusChange
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onScan: () => Promise<void>;
  onUseSuggestion: (suggestion: SearchSuggestion) => void;
  nearby: BuildingRecord[];
  scanning: boolean;
  scanMessage: string;
  selectedLocation?: ResolvedLocation | null;
  radiusMeters: number;
  onRadiusChange: (value: number) => void;
}) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
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

  return (
    <Panel className="p-5 hover:border-success/25 hover:shadow-[0_0_28px_rgba(46,164,79,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Smart Scanner</p>
          <h2 className="mt-2 font-display text-2xl text-white">Scan Address Or Click Map</h2>
          <p className="mt-2 text-sm text-muted">
            Search by name or address, or drop a scan point directly on the map for a simulation-backed readout.
          </p>
        </div>
        <span className="rounded-2xl border border-success/20 bg-success/10 p-3 text-success">
          <Sparkles size={18} />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onScan();
              }
            }}
            placeholder="Search address, city, or building"
            className="w-full rounded-xl border border-border bg-black/20 px-11 py-3 text-sm text-white placeholder:text-muted transition-all duration-200 focus:border-success focus:outline-none focus:shadow-[0_0_0_4px_rgba(46,164,79,0.12)]"
          />
        </div>
        {(suggestions.length > 0 || loadingSuggestions) && (
          <div className="overflow-hidden rounded-2xl border border-border bg-black/20">
            {loadingSuggestions ? (
              <p className="px-4 py-3 text-sm text-muted">Searching nearby matches...</p>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => onUseSuggestion(suggestion)}
                  className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] hover:bg-white/5 last:border-b-0 active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{suggestion.label}</p>
                    <p className="text-xs text-muted">{suggestion.subtitle}</p>
                  </div>
                  <Crosshair size={14} className="text-muted" />
                </button>
              ))
            )}
          </div>
        )}
        <RadiusControl value={radiusMeters} onChange={onRadiusChange} />
        <Button onClick={onScan} className="w-full" disabled={scanning}>
          {scanning ? "Scanning..." : "Run Abandonment Scan"}
        </Button>
        <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Live Scan Status</p>
          <p className="mt-2 text-sm text-slate-200">{scanning ? scanMessage : "Ready for the next map click or search scan."}</p>
          {selectedLocation ? (
            <p className="mt-2 text-xs text-muted">{selectedLocation.fullAddress}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Radius Scan Results</p>
          <span className="text-xs text-muted">{nearby.length} candidates</span>
        </div>
        <div className="space-y-3">
          {nearby.map((building) => (
            <div
              key={building.id}
              className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-success/30 hover:bg-black/30 hover:shadow-[0_0_24px_rgba(46,164,79,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{building.name}</p>
                  <p className="text-xs text-muted">{building.address}</p>
                </div>
                <span className="font-mono text-sm text-success">{building.abandonmentScore}%</span>
              </div>
            </div>
          ))}
          {!nearby.length && <p className="text-sm text-muted">Run a radius scan to populate candidates around the selected point.</p>}
        </div>
      </div>
    </Panel>
  );
}
