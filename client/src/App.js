import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
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
const toLocationFromBuilding = (building) => ({
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
    const [buildings, setBuildings] = useState([]);
    const [stats, setStats] = useState(null);
    const [heatmap, setHeatmap] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [reports, setReports] = useState([]);
    const [nearby, setNearby] = useState([]);
    const [query, setQuery] = useState("");
    const [scanRadiusMeters, setScanRadiusMeters] = useState(500);
    const [route, setRoute] = useState(null);
    const [routeMode, setRouteMode] = useState("driving");
    const [routeOrigin, setRouteOrigin] = useState(null);
    const [imageModal, setImageModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanLoading, setScanLoading] = useState(false);
    const [routeLoading, setRouteLoading] = useState(false);
    const [explorerMode, setExplorerMode] = useState(true);
    const [heatmapEnabled, setHeatmapEnabled] = useState(true);
    const [scanMessageIndex, setScanMessageIndex] = useState(0);
    const [activeAnimation, setActiveAnimation] = useState(null);
    const { pushToast } = useToast();
    const selectedBuildingPersisted = useMemo(() => (selectedBuilding ? buildings.some((building) => building.id === selectedBuilding.id) : false), [buildings, selectedBuilding]);
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
            setSelectedBuilding((current) => current ? buildingsResponse.find((item) => item.id === current.id) ?? current : buildingsResponse[0] ?? null);
            setSelectedLocation((current) => current ?? (buildingsResponse[0] ? toLocationFromBuilding(buildingsResponse[0]) : null));
        }
        finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };
    const loadBuildingDetails = async (id) => {
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
    const likelyAbandoned = useMemo(() => buildings.filter((building) => building.abandonmentScore >= 70).length, [buildings]);
    const handleScan = async (coordinates) => {
        setScanLoading(true);
        const requestedCoordinates = coordinates ?? (!query.trim() ? selectedLocation?.coordinates ?? selectedBuilding?.coordinates ?? undefined : undefined);
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
            const response = await api.scan(requestedCoordinates ? { coordinates: requestedCoordinates, radiusMeters: scanRadiusMeters } : { query, radiusMeters: scanRadiusMeters });
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
            }
            else {
                await Promise.all([refreshWorkspace(false), loadBuildingDetails(response.building.id)]);
                pushToast({
                    title: "Scan completed",
                    description: `${response.building.name} scored ${response.building.abandonmentScore}% within ${response.scanRadiusMeters}m`
                });
            }
        }
        catch (error) {
            pushToast({
                title: "Scan failed",
                description: error instanceof Error ? error.message : "Please try again."
            });
        }
        finally {
            setScanLoading(false);
        }
    };
    const handleSuggestion = async (suggestion) => {
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
        }
        catch (error) {
            pushToast({
                title: "Area scan failed",
                description: error instanceof Error ? error.message : "Please try again."
            });
        }
        finally {
            setScanLoading(false);
        }
    };
    const getBrowserLocation = async () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not available in this browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }), () => reject(new Error("Browser location permission was denied.")), {
            enableHighAccuracy: true,
            timeout: 6000
        });
    });
    const handleRoute = async (profile = routeMode, preferredOrigin) => {
        if (!selectedBuilding)
            return;
        setRouteLoading(true);
        try {
            let from;
            try {
                from = preferredOrigin ?? (await getBrowserLocation());
            }
            catch {
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
        }
        catch (error) {
            pushToast({
                title: "Route failed",
                description: error instanceof Error ? error.message : "Please try again."
            });
        }
        finally {
            setRouteLoading(false);
        }
    };
    const handleRouteModeChange = (nextMode) => {
        setRouteMode(nextMode);
        if (route && selectedBuilding) {
            void handleRoute(nextMode, routeOrigin);
        }
    };
    const selectedCoordinates = selectedLocation?.coordinates ?? selectedBuilding?.coordinates ?? null;
    const placeIntelligence = selectedLocation?.placeIntelligence;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mx-auto max-w-[1200px] px-6 py-6", children: [_jsx("header", { className: "mb-6 rounded-3xl border border-border bg-panel/90 px-6 py-5 shadow-panel backdrop-blur", children: _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "rounded-full border border-success/20 bg-success/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-success", children: "Operations Dashboard" }), _jsx("span", { className: "rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-muted", children: "Leaflet + OSRM" })] }), _jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl text-white", children: "Abandonment Scanner" }), _jsx("p", { className: "mt-2 max-w-3xl text-sm leading-6 text-muted", children: "Stable Leaflet scanning, Nominatim reverse geocoding, OSRM route previews, heatmap overlays, and a GitHub-inspired dark dashboard for abandonment analysis." })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs(Button, { variant: "secondary", onClick: () => setExplorerMode((value) => !value), children: [_jsx(GitBranch, { size: 16, className: "mr-2" }), explorerMode ? "Explorer Mode On" : "Explorer Mode Off"] }), _jsxs("div", { className: "inline-flex rounded-xl border border-border bg-black/20 p-1", children: [_jsx("button", { onClick: () => handleRouteModeChange("driving"), className: `rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${routeMode === "driving"
                                                        ? "border-success bg-success/20 text-white shadow-[0_0_24px_rgba(46,164,79,0.24)]"
                                                        : "border-transparent text-muted hover:scale-[1.02] hover:border-success/30 hover:text-white"}`, children: "Driving" }), _jsx("button", { onClick: () => handleRouteModeChange("walking"), className: `rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${routeMode === "walking"
                                                        ? "border-success bg-success/20 text-white shadow-[0_0_24px_rgba(46,164,79,0.24)]"
                                                        : "border-transparent text-muted hover:scale-[1.02] hover:border-success/30 hover:text-white"}`, children: "Walking" })] })] })] }) }), loading || !stats ? (_jsxs("div", { className: "space-y-4", children: [_jsx(LoadingSkeleton, { className: "h-36" }), _jsx(LoadingSkeleton, { className: "h-[580px]" })] })) : (_jsxs(_Fragment, { children: [_jsx(DashboardStatsGrid, { stats: stats, activeAnimation: activeAnimation, onCardClick: (key) => setActiveAnimation(key) }), _jsxs("div", { className: "mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]", children: [_jsxs("div", { className: "space-y-6", children: [_jsx(ScannerPanel, { query: query, onQueryChange: setQuery, onScan: () => handleScan(), onUseSuggestion: handleSuggestion, nearby: nearby, scanning: scanLoading, scanMessage: scanMessages[scanMessageIndex], selectedLocation: selectedLocation, radiusMeters: scanRadiusMeters, onRadiusChange: setScanRadiusMeters }), selectedBuilding && selectedLocation?.scanAllowed !== false && selectedBuildingPersisted ? (_jsx(ReportComposer, { building: selectedBuilding, onSubmitted: () => loadBuildingDetails(selectedBuilding.id) })) : null, _jsxs("div", { className: "rounded-2xl border border-border bg-panel/90 p-5 shadow-panel", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Risk Warning System" }), _jsxs("p", { className: "mt-2 font-display text-2xl text-white", children: [likelyAbandoned, " high-risk sites"] }), _jsx("p", { className: "mt-2 text-sm leading-6 text-muted", children: "Heatmap concentrations above 70% are visually emphasized in red and should be treated as likely abandoned until field verification says otherwise." })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsx(MapView, { buildings: buildings, scanResults: nearby, heatmap: heatmap, selectedId: selectedBuilding?.id, selectedCoordinates: selectedCoordinates, scanRadiusMeters: scanRadiusMeters, selectedLocationLabel: selectedLocation?.fullAddress, route: route, routeOrigin: routeOrigin, explorerMode: explorerMode, heatmapEnabled: heatmapEnabled, scanLoading: scanLoading, onSelect: (building) => {
                                                    setSelectedBuilding(building);
                                                    setSelectedLocation(toLocationFromBuilding(building));
                                                    setRoute(null);
                                                }, onScanArea: handleScanArea, onToggleHeatmap: () => setHeatmapEnabled((value) => !value), onMapClick: async (coordinates) => handleScan(coordinates) }), selectedBuilding ? (_jsxs("div", { className: "grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]", children: [_jsx(BuildingDetails, { building: selectedBuilding, reports: reports, onViewImage: setImageModal, onRequestRoute: handleRoute, onRefresh: () => loadBuildingDetails(selectedBuilding.id) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-2xl border border-border bg-panel/90 p-5 shadow-panel", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-100", children: [_jsx(MapPinned, { size: 16, className: "text-success" }), _jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Mini Map Preview" })] }), _jsx("div", { className: "mt-4", children: _jsx(MiniMap, { coordinates: selectedCoordinates, score: selectedBuilding.abandonmentScore, route: route }) }), _jsx("p", { className: "mt-4 text-sm leading-6 text-muted", children: "Preview-only mini map synced to the selected location. Interaction is intentionally disabled for a stable summary view." })] }), _jsxs("div", { className: "rounded-2xl border border-border bg-panel/90 p-5 shadow-panel", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Selected Address" }), _jsx("h3", { className: "mt-2 font-display text-2xl text-white", children: formatResolvedLocation(selectedLocation) }), _jsx("p", { className: "mt-2 text-sm text-muted", children: selectedLocation?.fullAddress ?? "Awaiting location scan" }), selectedCoordinates ? (_jsxs("p", { className: "mt-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 font-mono text-xs text-slate-300", children: [selectedCoordinates.lat.toFixed(5), ", ", selectedCoordinates.lng.toFixed(5)] })) : null] }), placeIntelligence ? (_jsxs("div", { className: "rounded-2xl border border-border bg-panel/90 p-5 shadow-panel", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Place Intelligence" }), _jsx("h3", { className: "mt-2 font-display text-2xl text-white", children: placeIntelligence.name }), _jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-3", children: [_jsxs("div", { className: "rounded-2xl border border-white/5 bg-black/20 p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Type" }), _jsx("p", { className: "mt-2 text-sm capitalize text-slate-100", children: placeIntelligence.type })] }), _jsxs("div", { className: "rounded-2xl border border-white/5 bg-black/20 p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Category" }), _jsx("p", { className: "mt-2 text-sm capitalize text-slate-100", children: placeIntelligence.category })] }), _jsxs("div", { className: "rounded-2xl border border-white/5 bg-black/20 p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Confidence" }), _jsxs("p", { className: "mt-2 text-sm text-slate-100", children: [placeIntelligence.confidence, "%"] })] })] }), _jsx("p", { className: "mt-4 text-sm leading-6 text-slate-300", children: placeIntelligence.notes })] })) : null, _jsxs("div", { className: "rounded-2xl border border-border bg-panel/90 p-5 shadow-panel", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Route Preview" }), _jsx("h3", { className: "mt-2 font-display text-2xl text-white", children: routeLoading ? "Generating..." : route ? `${route.distanceKm} km / ${route.durationMinutes} min` : "Ready" }), _jsx("p", { className: "mt-2 text-sm text-muted", children: route
                                                                            ? `OSRM route preview ready with ${route.profile} guidance.`
                                                                            : `Generate a ${routeMode} route from your browser location to the selected building.` }), routeOrigin ? (_jsxs("p", { className: "mt-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 font-mono text-xs text-slate-300", children: ["origin: ", routeOrigin.lat.toFixed(4), ", ", routeOrigin.lng.toFixed(4)] })) : null, _jsx(Button, { onClick: () => handleRoute(routeMode), className: "mt-4 w-full", disabled: routeLoading, children: routeLoading ? (_jsxs(_Fragment, { children: [_jsx(LoaderCircle, { className: "mr-2 animate-spin", size: 16 }), "Generating Route..."] })) : (_jsxs(_Fragment, { children: [_jsx(Route, { className: "mr-2", size: 16 }), "Get ", routeMode === "driving" ? "Driving" : "Walking", " Route"] })) })] })] })] })) : null] })] })] }))] }), imageModal && selectedBuilding ? (_jsx(ImageModal, { imageUrl: imageModal, title: selectedBuilding.name, onClose: () => setImageModal(null) })) : null] }));
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
        if (location.pathname === "/" ||
            location.pathname === "/docs" ||
            location.pathname === "/about" ||
            location.pathname === "/download" ||
            location.pathname === "/legal") {
            return;
        }
        navigate("/", { replace: true });
    }, [location.pathname, navigate]);
    if (location.pathname === "/docs") {
        return _jsx(DocsPage, {});
    }
    if (location.pathname === "/about") {
        return _jsx(AboutPage, {});
    }
    if (location.pathname === "/download") {
        return _jsx(DownloadPage, {});
    }
    if (location.pathname === "/legal") {
        return _jsx(LegalPage, {});
    }
    return _jsx(ScannerWorkspace, {});
}
export function App() {
    return (_jsx(ToastProvider, { children: _jsx(RouterProvider, { children: _jsxs("div", { className: "min-h-screen bg-[#0d1117] text-slate-100", children: [_jsx(RouteEffects, {}), _jsx(Header, {}), _jsx(AppRouter, {}), _jsx(ToastViewport, {})] }) }) }));
}
