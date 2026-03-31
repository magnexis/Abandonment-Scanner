import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { Flame, LoaderCircle, Navigation, Radar } from "lucide-react";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { DEFAULT_CENTER, TILE_ATTRIBUTION, TILE_URL, createMarkerHtml, getScoreColor, toLeafletLatLng, toLeafletRoute } from "../../utils/map";
export function MapView({ buildings, scanResults, heatmap, selectedId, selectedCoordinates, scanRadiusMeters, selectedLocationLabel, route, routeOrigin, explorerMode, heatmapEnabled, scanLoading, onSelect, onScanArea, onToggleHeatmap, onMapClick }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const heatLayerRef = useRef(null);
    const markersLayerRef = useRef(null);
    const resultsLayerRef = useRef(null);
    const scanLayerRef = useRef(null);
    const routeLayerRef = useRef(null);
    const latestClickHandler = useRef(onMapClick);
    useEffect(() => {
        latestClickHandler.current = onMapClick;
    }, [onMapClick]);
    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return;
        }
        const map = L.map(containerRef.current, {
            preferCanvas: true,
            zoomControl: false,
            worldCopyJump: false
        }).setView(toLeafletLatLng(DEFAULT_CENTER), 11);
        L.control
            .zoom({
            position: "topright"
        })
            .addTo(map);
        L.tileLayer(TILE_URL, {
            attribution: TILE_ATTRIBUTION,
            subdomains: "abcd",
            maxZoom: 20
        }).addTo(map);
        map.createPane("heat-pane");
        const heatPane = map.getPane("heat-pane");
        if (heatPane) {
            heatPane.style.zIndex = "300";
        }
        heatLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);
        resultsLayerRef.current = L.layerGroup().addTo(map);
        scanLayerRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
        map.on("click", async (event) => {
            await latestClickHandler.current({
                lat: event.latlng.lat,
                lng: event.latlng.lng
            });
        });
        mapRef.current = map;
        const frame = window.requestAnimationFrame(() => map.invalidateSize());
        return () => {
            window.cancelAnimationFrame(frame);
            map.remove();
            mapRef.current = null;
        };
    }, []);
    useEffect(() => {
        const map = mapRef.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer)
            return;
        markersLayer.clearLayers();
        buildings.forEach((building) => {
            const marker = L.marker(toLeafletLatLng(building.coordinates), {
                icon: L.divIcon({
                    className: "leaflet-marker",
                    html: createMarkerHtml(getScoreColor(building.abandonmentScore), building.id === selectedId),
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                })
            });
            marker.on("click", () => onSelect(building));
            marker.addTo(markersLayer);
        });
    }, [buildings, onSelect, selectedId]);
    useEffect(() => {
        const resultsLayer = resultsLayerRef.current;
        if (!resultsLayer)
            return;
        resultsLayer.clearLayers();
        const existingIds = new Set(buildings.map((building) => building.id));
        scanResults
            .filter((building) => building.id !== selectedId && !existingIds.has(building.id))
            .forEach((building) => {
            const marker = L.marker(toLeafletLatLng(building.coordinates), {
                icon: L.divIcon({
                    className: "leaflet-marker",
                    html: createMarkerHtml(getScoreColor(building.abandonmentScore)),
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                })
            });
            marker.on("click", () => onSelect(building));
            marker.addTo(resultsLayer);
        });
    }, [buildings, onSelect, scanResults, selectedId]);
    useEffect(() => {
        const heatLayer = heatLayerRef.current;
        if (!heatLayer)
            return;
        heatLayer.clearLayers();
        if (!heatmapEnabled)
            return;
        heatmap.forEach((point) => {
            L.circle(toLeafletLatLng(point.coordinates), {
                pane: "heat-pane",
                radius: point.radiusMeters * 1.4,
                stroke: false,
                fillColor: point.color,
                fillOpacity: 0.06
            }).addTo(heatLayer);
            L.circle(toLeafletLatLng(point.coordinates), {
                pane: "heat-pane",
                radius: point.radiusMeters,
                stroke: false,
                fillColor: point.color,
                fillOpacity: 0.18
            }).addTo(heatLayer);
        });
    }, [heatmap, heatmapEnabled]);
    useEffect(() => {
        const map = mapRef.current;
        const scanLayer = scanLayerRef.current;
        if (!map || !scanLayer)
            return;
        scanLayer.clearLayers();
        if (!selectedCoordinates)
            return;
        L.circleMarker(toLeafletLatLng(selectedCoordinates), {
            radius: 9,
            color: "#f0f6fc",
            weight: 2,
            fillColor: "#2ea44f",
            fillOpacity: 0.92
        }).addTo(scanLayer);
        const radiusCircle = L.circle(toLeafletLatLng(selectedCoordinates), {
            radius: scanRadiusMeters,
            color: "#2ea44f",
            weight: 2,
            fillColor: "#2ea44f",
            fillOpacity: 0.2
        }).addTo(scanLayer);
        if (!route) {
            map.fitBounds(radiusCircle.getBounds(), { padding: [32, 32], animate: true });
        }
    }, [route, scanRadiusMeters, selectedCoordinates?.lat, selectedCoordinates?.lng]);
    useEffect(() => {
        const map = mapRef.current;
        const routeLayer = routeLayerRef.current;
        if (!map || !routeLayer)
            return;
        routeLayer.clearLayers();
        if (!route)
            return;
        const polyline = L.polyline(toLeafletRoute(route), {
            color: "#2ea44f",
            weight: 5,
            opacity: 0.95
        }).addTo(routeLayer);
        if (routeOrigin) {
            L.circleMarker(toLeafletLatLng(routeOrigin), {
                radius: 8,
                color: "#f0f6fc",
                weight: 2,
                fillColor: "#58a6ff",
                fillOpacity: 0.95
            }).addTo(routeLayer);
        }
        map.fitBounds(polyline.getBounds(), { padding: [36, 36], animate: true });
    }, [route, routeOrigin?.lat, routeOrigin?.lng]);
    return (_jsxs(Panel, { className: "overflow-hidden", children: [_jsxs("div", { className: "flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Interactive Map" }), _jsx("h2", { className: "mt-2 font-display text-2xl text-white", children: "Leaflet Scan Workspace" }), _jsx("p", { className: "mt-2 text-sm text-muted", children: "Click anywhere to place a scan marker, reverse geocode the area, and refresh the abandonment analysis." })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs(Button, { variant: heatmapEnabled ? "primary" : "secondary", onClick: onToggleHeatmap, children: [_jsx(Flame, { size: 16, className: "mr-2" }), heatmapEnabled ? "Heatmap On" : "Heatmap Off"] }), _jsxs(Button, { variant: "secondary", onClick: onScanArea, children: [_jsx(Radar, { size: 16, className: "mr-2" }), "Scan Area"] })] })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { ref: containerRef, className: "leaflet-map min-h-[580px]" }), scanLoading ? (_jsx("div", { className: "absolute inset-0 z-[500] flex items-center justify-center bg-black/28 backdrop-blur-[2px]", children: _jsx("div", { className: "rounded-2xl border border-success/20 bg-panel/90 px-5 py-4 shadow-panel", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(LoaderCircle, { className: "animate-spin text-success", size: 18 }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Scanning selected location..." }), _jsx("p", { className: "text-xs text-muted", children: "Reverse geocoding and recalculating abandonment signals" })] })] }) }) })) : null, _jsxs("div", { className: "pointer-events-none absolute left-4 top-4 z-[450] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-muted", children: "Selected Location" }), _jsx("p", { className: "mt-1 text-sm font-medium text-slate-100", children: selectedLocationLabel || "Click the map to scan a location" }), _jsxs("p", { className: "mt-1 text-xs text-success", children: ["Scan Radius: ", scanRadiusMeters, "m"] }), selectedCoordinates ? (_jsxs("p", { className: "mt-1 font-mono text-xs text-muted", children: [selectedCoordinates.lat.toFixed(4), ", ", selectedCoordinates.lng.toFixed(4)] })) : null] }), route ? (_jsxs("div", { className: "absolute bottom-4 left-4 z-[450] rounded-2xl border border-success/20 bg-black/75 px-4 py-3 backdrop-blur", children: [_jsxs("div", { className: "flex items-center gap-2 text-success", children: [_jsx(Navigation, { size: 16 }), _jsx("p", { className: "text-sm font-medium", children: "Route Preview Overlay" })] }), _jsxs("p", { className: "mt-2 text-sm text-slate-100", children: [route.profile, " \u00B7 ", route.distanceKm, " km \u00B7 ", route.durationMinutes, " min"] }), _jsxs("p", { className: "mt-1 text-xs text-muted", children: ["Provider: ", route.provider] }), route.warning ? _jsx("p", { className: "mt-1 text-xs text-warning", children: route.warning }) : null] })) : null, explorerMode ? (_jsx("div", { className: "absolute right-4 top-4 z-[450] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-xs text-muted backdrop-blur", children: "Explorer mode highlights high-risk corridors and scan areas." })) : null] })] }));
}
