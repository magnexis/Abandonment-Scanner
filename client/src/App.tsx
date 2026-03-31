import { useEffect, useMemo, useState } from "react";
import type {
  BuildingRecord,
  Coordinates,
  DashboardStats,
  HeatmapPoint,
  PlaceIntelligence,
  ReportSummary,
  ResolvedLocation,
  RouteResult,
  SearchSuggestion
} from "@shared/index";
import { GitBranch, LoaderCircle, MapPinned, Route } from "lucide-react";
import { api } from "./api/client";
import { Button } from "./components/Button";
import Header from "./components/Header.jsx";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ToastViewport } from "./components/ToastViewport";
import { DashboardStats as DashboardStatsGrid } from "./features/dashboard/DashboardStats";
import { BuildingDetails } from "./features/map/BuildingDetails";
import { MapView } from "./features/map/MapView";
import { MiniMap } from "./features/map/MiniMap";
import { ReportComposer } from "./features/reports/ReportComposer";
import { ScannerPanel } from "./features/scanner/ScannerPanel";
import { ImageModal } from "./features/shared/ImageModal";
import { ToastProvider, useToast } from "./hooks/useToast";
import { RouterProvider, useLocation, useNavigate } from "./lib/router";
import AboutPage from "./pages/About.jsx";
import DocsPage from "./pages/Docs.jsx";
import DownloadPage from "./pages/Download.jsx";
import LegalPage from "./pages/Legal.jsx";
import { DEFAULT_CENTER, formatResolvedLocation } from "./utils/map";

const scanMessages = [
  "Stabilizing map selection...",
  "Reverse geocoding with Nominatim...",
  "Analyzing abandonment signals...",
  "Refreshing nearby candidates..."
];

const toLocationFromBuilding = (building: BuildingRecord): ResolvedLocation => ({
  coordinates: building.coordinates,
  fullAddress: building.fullAddress,
  city: building.city,
  state: building.state,
  country: building.country,
  label: building.address,
  classification: "unknown",
  scanAllowed: true
});

function ScannerWorkspace() {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRecord | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ResolvedLocation | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [nearby, setNearby] = useState<BuildingRecord[]>([]);
  const [query, setQuery] = useState("");
  const [scanRadiusMeters, setScanRadiusMeters] = useState(500);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeMode, setRouteMode] = useState<"driving" | "walking">("driving");
  const [routeOrigin, setRouteOrigin] = useState<Coordinates | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [explorerMode, setExplorerMode] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const { pushToast } = useToast();
  const selectedBuildingPersisted = useMemo(
    () => (selectedBuilding ? buildings.some((building) => building.id === selectedBuilding.id) : false),
    [buildings, selectedBuilding]
  );

  useEffect(() => {
    if (!scanLoading) {
      setScanMessageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setScanMessageIndex((current) => (current + 1) % scanMessages.length);
    }, 900);

    return () => window.clearInterval(interval);
  }, [scanLoading]);

  useEffect(() => {
    if (!activeAnimation) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setActiveAnimation(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [activeAnimation]);

  const refreshWorkspace = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [buildingsResponse, dashboardResponse, heatmapResponse] = await Promise.all([
        api.getBuildings(),
        api.getDashboard(),
        api.getHeatmap()
      ]);
      setBuildings(buildingsResponse);
      setStats(dashboardResponse);
      setHeatmap(heatmapResponse);
      setSelectedBuilding((current) =>
        current ? buildingsResponse.find((item) => item.id === current.id) ?? current : buildingsResponse[0] ?? null
      );
      setSelectedLocation((current) => current ?? (buildingsResponse[0] ? toLocationFromBuilding(buildingsResponse[0]) : null));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadBuildingDetails = async (id: string) => {
    const details = await api.getBuilding(id);
    setSelectedBuilding(details.building);
    setReports(details.reports);
    setBuildings((current) => current.map((item) => (item.id === details.building.id ? details.building : item)));
  };

  useEffect(() => {
    refreshWorkspace(true).catch((error) => {
      pushToast({
        title: "Unable to load workspace",
        description: error instanceof Error ? error.message : "Check the API server."
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedBuilding || selectedLocation?.scanAllowed === false || !selectedBuildingPersisted) {
      setReports([]);
      return;
    }
    loadBuildingDetails(selectedBuilding.id).catch(() => undefined);
  }, [selectedBuilding?.id, selectedBuildingPersisted, selectedLocation?.scanAllowed]);

  const likelyAbandoned = useMemo(
    () => buildings.filter((building) => building.abandonmentScore >= 70).length,
    [buildings]
  );

  const handleScan = async (coordinates?: Coordinates) => {
    setScanLoading(true);
    const requestedCoordinates =
      coordinates ?? (!query.trim() ? selectedLocation?.coordinates ?? selectedBuilding?.coordinates ?? undefined : undefined);

    if (requestedCoordinates) {
      setSelectedLocation({
        coordinates: requestedCoordinates,
        fullAddress: `${requestedCoordinates.lat.toFixed(5)}, ${requestedCoordinates.lng.toFixed(5)}`,
        city: "Resolving city...",
        state: "Resolving state...",
        country: "Resolving country...",
        label: "Dropped scan point",
        classification: "unknown",
        scanAllowed: true
      });
    }

    try {
      const response = await api.scan(
        requestedCoordinates ? { coordinates: requestedCoordinates, radiusMeters: scanRadiusMeters } : { query, radiusMeters: scanRadiusMeters }
      );
      setSelectedBuilding(response.building);
      setSelectedLocation(response.location);
      setNearby(response.nearby);
      setRouteOrigin(response.routePreviewOrigin);
      setHeatmap(response.heatmap);
      setBuildings((current) => {
        const next = new Map(current.map((item) => [item.id, item]));
        [response.building].forEach((item) => next.set(item.id, item));
        return [...next.values()];
      });
      setRoute(null);
      if (response.residentialFiltered) {
        setReports([]);
        await refreshWorkspace(false);
        pushToast({
          title: "Residential area filtered",
          description: "The scanner lowered risk scoring and skipped high-abandonment results in this zone."
        });
      } else {
        await Promise.all([refreshWorkspace(false), loadBuildingDetails(response.building.id)]);
        pushToast({
          title: "Scan completed",
          description: `${response.building.name} scored ${response.building.abandonmentScore}% within ${response.scanRadiusMeters}m`
        });
      }
    } catch (error) {
      pushToast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setScanLoading(false);
    }
  };

  const handleSuggestion = async (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label);
    await handleScan(suggestion.coordinates);
  };

  const handleScanArea = async () => {
    const center = selectedLocation?.coordinates ?? selectedBuilding?.coordinates ?? DEFAULT_CENTER;
    setScanLoading(true);
    try {
      const results = await api.scanArea(center);
      setNearby(results.slice(0, 3));
      if (!selectedBuilding && results[0]) {
        setSelectedBuilding(results[0]);
        setSelectedLocation(toLocationFromBuilding(results[0]));
      }
      await refreshWorkspace(false);
      pushToast({
        title: "Area scanned",
        description: `${results.length} candidate locations were refreshed on the map.`
      });
    } catch (error) {
      pushToast({
        title: "Area scan failed",
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setScanLoading(false);
    }
  };

  const getBrowserLocation = async (): Promise<Coordinates> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not available in this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
        () => reject(new Error("Browser location permission was denied.")),
        {
          enableHighAccuracy: true,
          timeout: 6000
        }
      );
    });

  const handleRoute = async (profile: "driving" | "walking" = routeMode, preferredOrigin?: Coordinates | null) => {
    if (!selectedBuilding) return;
    setRouteLoading(true);
    try {
      let from: Coordinates;
      try {
        from = preferredOrigin ?? (await getBrowserLocation());
      } catch {
        from =
          preferredOrigin ??
          routeOrigin ??
          selectedLocation?.coordinates ?? {
            lat: selectedBuilding.coordinates.lat + 0.01,
            lng: selectedBuilding.coordinates.lng - 0.012
          };
      }

      const result = await api.route({
        from,
        to: selectedBuilding.coordinates,
        profile
      });
      setRouteOrigin(from);
      setRoute(result);
      pushToast({
        title: "Route ready",
        description: `${profile[0].toUpperCase()}${profile.slice(1)} mode · ${result.distanceKm} km · ${result.durationMinutes} min via ${result.provider}`
      });
    } catch (error) {
      pushToast({
        title: "Route failed",
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setRouteLoading(false);
    }
  };

  const handleRouteModeChange = (nextMode: "driving" | "walking") => {
    setRouteMode(nextMode);

    if (route && selectedBuilding) {
      void handleRoute(nextMode, routeOrigin);
    }
  };

  const selectedCoordinates = selectedLocation?.coordinates ?? selectedBuilding?.coordinates ?? null;
  const placeIntelligence: PlaceIntelligence | undefined = selectedLocation?.placeIntelligence;

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <header className="mb-6 rounded-3xl border border-border bg-panel/90 px-6 py-5 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-success">
                  Operations Dashboard
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-muted">
                  Leaflet + OSRM
                </span>
              </div>
              <div>
                <h1 className="font-display text-3xl text-white">Abandonment Scanner</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                  Stable Leaflet scanning, Nominatim reverse geocoding, OSRM route previews, heatmap overlays, and a
                  GitHub-inspired dark dashboard for abandonment analysis.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setExplorerMode((value) => !value)}>
                <GitBranch size={16} className="mr-2" />
                {explorerMode ? "Explorer Mode On" : "Explorer Mode Off"}
              </Button>
              <div className="inline-flex rounded-xl border border-border bg-black/20 p-1">
                <button
                  onClick={() => handleRouteModeChange("driving")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    routeMode === "driving"
                      ? "border-success bg-success/20 text-white shadow-[0_0_24px_rgba(46,164,79,0.24)]"
                      : "border-transparent text-muted hover:scale-[1.02] hover:border-success/30 hover:text-white"
                  }`}
                >
                  Driving
                </button>
                <button
                  onClick={() => handleRouteModeChange("walking")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    routeMode === "walking"
                      ? "border-success bg-success/20 text-white shadow-[0_0_24px_rgba(46,164,79,0.24)]"
                      : "border-transparent text-muted hover:scale-[1.02] hover:border-success/30 hover:text-white"
                  }`}
                >
                  Walking
                </button>
              </div>
            </div>
          </div>
        </header>

        {loading || !stats ? (
          <div className="space-y-4">
            <LoadingSkeleton className="h-36" />
            <LoadingSkeleton className="h-[580px]" />
          </div>
        ) : (
          <>
            <DashboardStatsGrid
              stats={stats}
              activeAnimation={activeAnimation}
              onCardClick={(key) => setActiveAnimation(key)}
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-6">
                <ScannerPanel
                  query={query}
                  onQueryChange={setQuery}
                  onScan={() => handleScan()}
                  onUseSuggestion={handleSuggestion}
                  nearby={nearby}
                  scanning={scanLoading}
                  scanMessage={scanMessages[scanMessageIndex]}
                  selectedLocation={selectedLocation}
                  radiusMeters={scanRadiusMeters}
                  onRadiusChange={setScanRadiusMeters}
                />
                {selectedBuilding && selectedLocation?.scanAllowed !== false && selectedBuildingPersisted ? (
                  <ReportComposer building={selectedBuilding} onSubmitted={() => loadBuildingDetails(selectedBuilding.id)} />
                ) : null}
                <div className="rounded-2xl border border-border bg-panel/90 p-5 shadow-panel">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">Risk Warning System</p>
                  <p className="mt-2 font-display text-2xl text-white">{likelyAbandoned} high-risk sites</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Heatmap concentrations above 70% are visually emphasized in red and should be treated as likely
                    abandoned until field verification says otherwise.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <MapView
                  buildings={buildings}
                  scanResults={nearby}
                  heatmap={heatmap}
                  selectedId={selectedBuilding?.id}
                  selectedCoordinates={selectedCoordinates}
                  scanRadiusMeters={scanRadiusMeters}
                  selectedLocationLabel={selectedLocation?.fullAddress}
                  route={route}
                  routeOrigin={routeOrigin}
                  explorerMode={explorerMode}
                  heatmapEnabled={heatmapEnabled}
                  scanLoading={scanLoading}
                  onSelect={(building) => {
                    setSelectedBuilding(building);
                    setSelectedLocation(toLocationFromBuilding(building));
                    setRoute(null);
                  }}
                  onScanArea={handleScanArea}
                  onToggleHeatmap={() => setHeatmapEnabled((value) => !value)}
                  onMapClick={async (coordinates) => handleScan(coordinates)}
                />
                {selectedBuilding ? (
                  <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
                    <BuildingDetails
                      building={selectedBuilding}
                      reports={reports}
                      onViewImage={setImageModal}
                      onRequestRoute={handleRoute}
                      onRefresh={() => loadBuildingDetails(selectedBuilding.id)}
                    />
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-border bg-panel/90 p-5 shadow-panel">
                        <div className="flex items-center gap-2 text-slate-100">
                          <MapPinned size={16} className="text-success" />
                          <p className="text-xs uppercase tracking-[0.24em] text-muted">Mini Map Preview</p>
                        </div>
                        <div className="mt-4">
                          <MiniMap coordinates={selectedCoordinates} score={selectedBuilding.abandonmentScore} route={route} />
                        </div>
                        <p className="mt-4 text-sm leading-6 text-muted">
                          Preview-only mini map synced to the selected location. Interaction is intentionally disabled
                          for a stable summary view.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-panel/90 p-5 shadow-panel">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted">Selected Address</p>
                        <h3 className="mt-2 font-display text-2xl text-white">
                          {formatResolvedLocation(selectedLocation)}
                        </h3>
                        <p className="mt-2 text-sm text-muted">{selectedLocation?.fullAddress ?? "Awaiting location scan"}</p>
                        {selectedCoordinates ? (
                          <p className="mt-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 font-mono text-xs text-slate-300">
                            {selectedCoordinates.lat.toFixed(5)}, {selectedCoordinates.lng.toFixed(5)}
                          </p>
                        ) : null}
                      </div>

                      {placeIntelligence ? (
                        <div className="rounded-2xl border border-border bg-panel/90 p-5 shadow-panel">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted">Place Intelligence</p>
                          <h3 className="mt-2 font-display text-2xl text-white">{placeIntelligence.name}</h3>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-muted">Type</p>
                              <p className="mt-2 text-sm capitalize text-slate-100">{placeIntelligence.type}</p>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-muted">Category</p>
                              <p className="mt-2 text-sm capitalize text-slate-100">{placeIntelligence.category}</p>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-muted">Confidence</p>
                              <p className="mt-2 text-sm text-slate-100">{placeIntelligence.confidence}%</p>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-slate-300">{placeIntelligence.notes}</p>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-border bg-panel/90 p-5 shadow-panel">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted">Route Preview</p>
                        <h3 className="mt-2 font-display text-2xl text-white">
                          {routeLoading ? "Generating..." : route ? `${route.distanceKm} km / ${route.durationMinutes} min` : "Ready"}
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                          {route
                            ? `OSRM route preview ready with ${route.profile} guidance.`
                            : `Generate a ${routeMode} route from your browser location to the selected building.`}
                        </p>
                        {routeOrigin ? (
                          <p className="mt-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 font-mono text-xs text-slate-300">
                            origin: {routeOrigin.lat.toFixed(4)}, {routeOrigin.lng.toFixed(4)}
                          </p>
                        ) : null}
                        <Button onClick={() => handleRoute(routeMode)} className="mt-4 w-full" disabled={routeLoading}>
                          {routeLoading ? (
                            <>
                              <LoaderCircle className="mr-2 animate-spin" size={16} />
                              Generating Route...
                            </>
                          ) : (
                            <>
                              <Route className="mr-2" size={16} />
                              Get {routeMode === "driving" ? "Driving" : "Walking"} Route
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
      {imageModal && selectedBuilding ? (
        <ImageModal imageUrl={imageModal} title={selectedBuilding.name} onClose={() => setImageModal(null)} />
      ) : null}
    </>
  );
}

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  return null;
}

function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      location.pathname === "/" ||
      location.pathname === "/docs" ||
      location.pathname === "/about" ||
      location.pathname === "/download" ||
      location.pathname === "/legal"
    ) {
      return;
    }

    navigate("/", { replace: true });
  }, [location.pathname, navigate]);

  if (location.pathname === "/docs") {
    return <DocsPage />;
  }

  if (location.pathname === "/about") {
    return <AboutPage />;
  }

  if (location.pathname === "/download") {
    return <DownloadPage />;
  }

  if (location.pathname === "/legal") {
    return <LegalPage />;
  }

  return <ScannerWorkspace />;
}

export function App() {
  return (
    <ToastProvider>
      <RouterProvider>
        <div className="min-h-screen bg-[#0d1117] text-slate-100">
          <RouteEffects />
          <Header />
          <AppRouter />
          <ToastViewport />
        </div>
      </RouterProvider>
    </ToastProvider>
  );
}
