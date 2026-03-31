import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { DEFAULT_CENTER, TILE_ATTRIBUTION, TILE_URL, createMarkerHtml, getScoreColor, toLeafletLatLng, toLeafletRoute } from "../../utils/map";
export function MiniMap({ coordinates, score, route }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const routeRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return;
        }
        const map = L.map(containerRef.current, {
            attributionControl: false,
            dragging: false,
            doubleClickZoom: false,
            zoomControl: false,
            boxZoom: false,
            keyboard: false,
            scrollWheelZoom: false,
            touchZoom: false,
            tap: false
        }).setView(toLeafletLatLng(coordinates ?? DEFAULT_CENTER), coordinates ? 14 : 11);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, subdomains: "abcd", maxZoom: 20 }).addTo(map);
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
        if (!map)
            return;
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
        if (coordinates) {
            markerRef.current = L.marker(toLeafletLatLng(coordinates), {
                icon: L.divIcon({
                    className: "leaflet-marker",
                    html: createMarkerHtml(getScoreColor(score ?? 50), true),
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(map);
            map.setView(toLeafletLatLng(coordinates), 14, { animate: false });
        }
        if (routeRef.current) {
            routeRef.current.remove();
            routeRef.current = null;
        }
        if (route) {
            routeRef.current = L.polyline(toLeafletRoute(route), {
                color: "#2ea44f",
                weight: 4,
                opacity: 0.85
            }).addTo(map);
            map.fitBounds(routeRef.current.getBounds(), { padding: [22, 22], animate: false });
        }
        const frame = window.requestAnimationFrame(() => map.invalidateSize());
        return () => window.cancelAnimationFrame(frame);
    }, [coordinates?.lat, coordinates?.lng, route, score]);
    return _jsx("div", { ref: containerRef, className: "mini-map min-h-[220px] rounded-2xl" });
}
