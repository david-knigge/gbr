"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";

const RACE_CENTER: [number, number] = [38.0494, -122.1586];
const DEFAULT_ZOOM = 15;

interface AdminRouteEditorProps {
  points: [number, number][];
  color: string;
  onChange: (points: [number, number][]) => void;
}

export function AdminRouteEditor({ points, color, onChange }: AdminRouteEditorProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pointsRef = useRef<[number, number][]>(points);
  const [ready, setReady] = useState(false);

  // Keep ref in sync
  pointsRef.current = points;

  const redraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Update polyline
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(pointsRef.current);
      polylineRef.current.setStyle({ color });
    }

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add numbered markers
    pointsRef.current.forEach((pt, i) => {
      const isFirst = i === 0;
      const isLast = i === pointsRef.current.length - 1;
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${isFirst || isLast ? 18 : 14}px; height:${isFirst || isLast ? 18 : 14}px;
          border-radius:50%; background:${isFirst ? '#22c55e' : isLast ? '#ef4444' : 'white'};
          border:2px solid ${color}; box-shadow:0 1px 4px rgba(0,0,0,0.3);
          display:flex; align-items:center; justify-content:center;
          font-size:8px; font-weight:700; color:${isFirst || isLast ? 'white' : color};
          cursor:grab; font-family:system-ui,sans-serif;
        ">${isFirst ? 'S' : isLast ? 'E' : i}</div>`,
        iconSize: [isFirst || isLast ? 18 : 14, isFirst || isLast ? 18 : 14],
        iconAnchor: [isFirst || isLast ? 9 : 7, isFirst || isLast ? 9 : 7],
      });

      const marker = L.marker(pt, { icon, draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        const updated = [...pointsRef.current];
        updated[i] = [
          Math.round(pos.lat * 1000000) / 1000000,
          Math.round(pos.lng * 1000000) / 1000000,
        ];
        onChange(updated);
      });

      // Right-click to delete waypoint
      marker.on("contextmenu", (e: L.LeafletMouseEvent) => {
        e.originalEvent.preventDefault();
        if (pointsRef.current.length <= 2) return;
        const updated = pointsRef.current.filter((_, idx) => idx !== i);
        onChange(updated);
      });

      markersRef.current.push(marker);
    });
  }, [color, onChange]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = points.length > 0 ? points[0] : RACE_CENTER;
    const map = L.map(containerRef.current, {
      center,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png").addTo(map);

    const polyline = L.polyline(points, {
      color,
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    polylineRef.current = polyline;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const pt: [number, number] = [
        Math.round(e.latlng.lat * 1000000) / 1000000,
        Math.round(e.latlng.lng * 1000000) / 1000000,
      ];
      onChange([...pointsRef.current, pt]);
    });

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      polylineRef.current = null;
      markersRef.current = [];
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when points or color change
  useEffect(() => {
    if (ready) redraw();
  }, [points, color, ready, redraw]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height: "450px", width: "100%" }}
        className="rounded border border-gray-300 overflow-hidden"
      />
      <p className="text-xs text-gray-500">
        Click map to add waypoints. Drag to reposition. Right-click to delete.
        <span className="font-mono ml-2">{points.length} points</span>
      </p>
    </div>
  );
}
