"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";

const RACE_CENTER: [number, number] = [38.0494, -122.1586];
const DEFAULT_ZOOM = 15;

interface AdminMapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

export function AdminMapPicker({ lat, lng, onChange, height = "300px" }: AdminMapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      onChange(
        Math.round(clickLat * 1000000) / 1000000,
        Math.round(clickLng * 1000000) / 1000000
      );
    },
    [onChange]
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: lat && lng ? [lat, lng] : RACE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    map.on("click", handleMapClick);

    mapRef.current = map;
    setReady(true);

    return () => {
      map.off("click", handleMapClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update click handler when onChange changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off("click");
    map.on("click", handleMapClick);
  }, [handleMapClick]);

  // Update marker when lat/lng changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width: 24px; height: 24px; border-radius: 50%;
            background: #E8643B;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: grab;
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], {
          icon,
          draggable: true,
        }).addTo(mapRef.current);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChange(
            Math.round(pos.lat * 1000000) / 1000000,
            Math.round(pos.lng * 1000000) / 1000000
          );
        });

        markerRef.current = marker;
      }
    }
  }, [lat, lng, ready, onChange]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded border border-gray-300 overflow-hidden"
      />
      <p className="text-xs text-gray-500">
        Click to place, drag to adjust.
        {lat && lng && (
          <span className="font-mono ml-1">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        )}
      </p>
    </div>
  );
}
