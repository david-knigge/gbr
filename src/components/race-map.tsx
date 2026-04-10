"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { MapPOI, POIIconConfig } from "@/lib/map-data";
import { POI_ICONS, POI_GROUPS } from "@/lib/map-data";
import { isCheckpointScanned } from "@/lib/quest-store";

// Benicia First Street Green area
const RACE_CENTER: [number, number] = [38.0494, -122.1586];
const DEFAULT_ZOOM = 15;

interface LoadedRoute {
  id: string;
  name: string;
  type: string;
  color: string;
  weight: number;
  opacity: number;
  dash_array: string | null;
  label: string | null;
  points: [number, number][];
}

interface CheckpointMarker {
  id: string;
  name: string;
  position: [number, number];
  is_completed: boolean;
  sort_order: number | null;
}

// Numbered checkpoint marker (0–9)
const checkpointIcon = (completed: boolean, index: number) => {
  const bg = completed ? "#22c55e" : "#7B5EA7";
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${bg};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 14px;
      font-family: system-ui, sans-serif;
    ">${completed ? '<i class="ph-bold ph-check" style="font-size:16px"></i>' : index}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #E8643B;
    border: 3px solid white;
    box-shadow: 0 0 0 3px rgba(232,100,59,0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function poiIcon(type: string, name?: string) {
  const config: POIIconConfig = POI_ICONS[type] || POI_ICONS.other;
  const label = name ? `<div style="
    position:absolute; top:24px; left:50%; transform:translateX(-50%);
    white-space:nowrap; font-size:9px; font-weight:600; font-family:system-ui,sans-serif;
    color:#333; text-shadow: 0 0 3px white, 0 0 3px white, 0 0 3px white;
    pointer-events:none;
  ">${name.length > 18 ? name.slice(0, 16) + '…' : name}</div>` : '';
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width: 22px; height: 22px; border-radius: 6px;
        background: ${config.color};
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
      "><i class="ph-bold ph-${config.icon}" style="color:white;font-size:11px;"></i></div>${label}</div>`,
    iconSize: [22, 36],
    iconAnchor: [11, 11],
  });
}

// Structured popup — bold title, detail rows with icons on separate lines
interface PopupDetail {
  text: string;
  icon?: "pin" | "clock" | "info" | "status";
}

function PopupContent({ title, details }: { title: string; details?: PopupDetail[] }) {
  const iconClass: Record<string, string> = {
    pin: "ph-bold ph-map-pin",
    clock: "ph-bold ph-clock",
    info: "ph-bold ph-info",
    status: "ph-bold ph-check-circle",
  };
  return (
    <>
      <span className="popup-title">{title.toLowerCase()}</span>
      {details?.map((d, i) => (
        <span key={i} className={`popup-row${d.icon === "status" ? " popup-status" : ""}`}>
          {d.icon && <i className={iconClass[d.icon] || iconClass.info} />}
          <span dangerouslySetInnerHTML={{ __html: d.text }} />
        </span>
      ))}
    </>
  );
}

// Build detail rows from structured POI fields
// POI types that won't have a Google Maps business listing — link by coords instead
const COORD_LINK_TYPES = new Set(["registration", "start", "finish", "aid", "restroom", "parking", "viewpoint", "park", "marina", "info", "stand", "other"]);

function poiDetails(poi: MapPOI): PopupDetail[] {
  const rows: PopupDetail[] = [];
  if (poi.location) {
    const href = poi.gmaps_url
      ? poi.gmaps_url
      : COORD_LINK_TYPES.has(poi.type)
        ? `https://www.google.com/maps/search/?api=1&query=${poi.position[0]},${poi.position[1]}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poi.name}, Benicia CA`)}`;
    rows.push({ text: `<a href="${href}" target="_blank" rel="noopener" style="color:#4DBFB3;text-decoration:none">${poi.location}</a>`, icon: "pin" });
  }
  if (poi.hours) {
    rows.push({ text: poi.hours, icon: "clock" });
  }
  if (poi.description) {
    rows.push({ text: poi.description, icon: "info" });
  }
  return rows;
}


function LocationTracker({ onLocationFound, onDenied }: { onLocationFound: (pos: [number, number]) => void; onDenied: () => void }) {
  const map = useMap();
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;

  useEffect(() => {
    if (!navigator.geolocation) return;

    const handleError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) onDeniedRef.current();
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => onLocationFound([pos.coords.latitude, pos.coords.longitude]),
      handleError,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM),
      handleError
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, onLocationFound]);

  return null;
}

interface RaceMapProps {
  showCourses?: boolean;
  ghostCourses?: boolean;
  showPOIs?: boolean;
  poiCategory?: "race" | "visitor";
  showCheckpoints?: boolean;
}

export function RaceMap({
  showCourses = true,
  ghostCourses = false,
  showPOIs = true,
  poiCategory = "race",
  showCheckpoints = false,
}: RaceMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [routes, setRoutes] = useState<LoadedRoute[]>([]);
  const [visibleRoutes, setVisibleRoutes] = useState<Set<string>>(new Set());
  const [legendOpen, setLegendOpen] = useState(true);
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    () => new Set(POI_GROUPS.filter((g) => g.defaultOn).map((g) => g.key))
  );
  const [loadedPois, setLoadedPois] = useState<MapPOI[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointMarker[]>([]);
  const [locationDenied, setLocationDenied] = useState(false);

  // Load routes
  useEffect(() => {
    fetch("/api/routes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LoadedRoute[]) => {
        setRoutes(data);
        // All routes visible by default
        setVisibleRoutes(new Set(data.map((r) => r.id)));
      })
      .catch(() => {});
  }, []);

  // Load POIs
  useEffect(() => {
    fetch("/api/pois")
      .then((r) => (r.ok ? r.json() : []))
      .then(setLoadedPois)
      .catch(() => {});
  }, []);

  // Load checkpoints for quest mode
  useEffect(() => {
    if (!showCheckpoints) return;
    fetch("/api/checkpoints")
      .then((r) => (r.ok ? r.json() : []))
      .then((cps: { id: string; name: string; sort_order: number | null; position_lat: number; position_lng: number }[]) => {
        setCheckpoints(
          cps.map((cp) => ({
            id: cp.id,
            name: cp.name,
            sort_order: cp.sort_order,
            position: [cp.position_lat, cp.position_lng] as [number, number],
            is_completed: isCheckpointScanned(cp.id),
          }))
        );
      })
      .catch(() => {});
  }, [showCheckpoints]);

  const handleLocationFound = useCallback((pos: [number, number]) => {
    setUserPosition(pos);
  }, []);

  const toggleRoute = (id: string) => {
    setVisibleRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const courseRoutes = routes.filter((r) => r.type === "course");
  const parkingRoutes = showCheckpoints ? [] : routes.filter((r) => r.type === "parking");

  // Build set of visible POI types from toggled groups
  const visiblePoiTypes = new Set(
    POI_GROUPS.filter((g) => visibleGroups.has(g.key)).flatMap((g) => g.types)
  );

  // Filter POIs by category + visible groups
  const filteredPois = loadedPois.filter((poi) => {
    const cat = (poi as MapPOI & { category?: string }).category || "race";
    const catMatch = poiCategory === "visitor" ? cat === "visitor" || cat === "both" : cat === "race" || cat === "both";
    return catMatch && visiblePoiTypes.has(poi.type);
  });

  const toggleGroup = (key: string) => {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Which groups have relevant POIs for the current tab?
  const activeGroups = POI_GROUPS.filter((g) =>
    g.types.some((t) =>
      loadedPois.some((poi) => {
        const cat = (poi as MapPOI & { category?: string }).category || "race";
        const catMatch = poiCategory === "visitor" ? cat === "visitor" || cat === "both" : cat === "race" || cat === "both";
        return catMatch && poi.type === t;
      })
    )
  );

  return (
    <>
      <MapContainer
        center={RACE_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <LocationTracker onLocationFound={handleLocationFound} onDenied={() => setLocationDenied(true)} />

        {userPosition && (
          <>
            <Circle
              center={userPosition}
              radius={30}
              pathOptions={{ color: "#E8643B", fillColor: "#E8643B", fillOpacity: 0.1, weight: 1 }}
            />
            <Marker position={userPosition} icon={userIcon}>
              <Popup><PopupContent title="you are here" /></Popup>
            </Marker>
          </>
        )}

        {/* ghost courses — thin, dashed, non-interactive */}
        {ghostCourses &&
          courseRoutes.map((route) => (
            <Polyline
              key={`ghost-${route.id}`}
              positions={route.points}
              pathOptions={{
                color: route.color,
                weight: 3,
                opacity: 0.8,
                dashArray: "6 8",
                lineCap: "round",
                lineJoin: "round",
                interactive: false,
              }}
            />
          ))}

        {/* All visible routes */}
        {routes
          .filter((r) => visibleRoutes.has(r.id))
          .filter((r) => showCourses || r.type !== "course")
          .map((route) => (
            <Polyline
              key={route.id}
              positions={route.points}
              pathOptions={{
                color: route.color,
                weight: route.weight,
                opacity: route.opacity,
                dashArray: route.dash_array || undefined,
                lineCap: "round",
                lineJoin: "round",
                interactive: route.type === "course",
              }}
            >
              {route.type === "course" && (
                <Popup>
                  <PopupContent
                    title={route.name}
                    details={route.label ? [{ text: route.label, icon: "clock" }] : []}
                  />
                </Popup>
              )}
            </Polyline>
          ))}

        {showPOIs &&
          filteredPois.map((poi) => (
            <Marker key={`${poi.name}-${poi.position[0]}`} position={poi.position} icon={poiIcon(poi.type, poi.name)}>
              <Popup><PopupContent title={poi.name} details={poiDetails(poi)} /></Popup>
            </Marker>
          ))}

        {showCheckpoints &&
          checkpoints.map((cp, i) => (
            <Marker
              key={cp.id}
              position={cp.position}
              icon={checkpointIcon(cp.is_completed, cp.sort_order != null ? cp.sort_order : i)}
            >
              <Popup>
                <PopupContent
                  title={`#${cp.sort_order != null ? cp.sort_order : i} ${cp.name}`}
                  details={[{
                    text: cp.is_completed
                      ? '<span style="color:#22c55e">completed</span>'
                      : '<span style="color:#7B5EA7">not yet scanned</span>',
                    icon: "status",
                  }]}
                />
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* legend — top right */}
      {(showCourses || showPOIs) && (
        <div className="absolute top-3 right-3 z-[1000]">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-xs font-medium text-foreground flex items-center gap-1.5"
          >
            <i className="ph-bold ph-list text-sm" />
            legend
          </button>
          {legendOpen && (
            <div className="mt-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3.5 space-y-2 min-w-[180px]">
              {showCourses && (
                <>
                  <div className="text-[10px] font-medium text-muted uppercase tracking-wide">courses</div>
                  {courseRoutes.map((route) => (
                    <label key={route.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleRoutes.has(route.id)}
                        onChange={() => toggleRoute(route.id)}
                        className="rounded accent-teal w-3.5 h-3.5"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: route.color }}
                      />
                      <span className="text-xs font-medium text-foreground">{route.name}</span>
                      {route.label && <span className="text-[10px] text-muted ml-auto">{route.label}</span>}
                    </label>
                  ))}
                  <hr className="border-card-border" />
                </>
              )}
              {parkingRoutes.length > 0 && (
                <>
                  {parkingRoutes.map((route) => (
                    <label key={route.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleRoutes.has(route.id)}
                        onChange={() => toggleRoute(route.id)}
                        className="rounded accent-teal w-3.5 h-3.5"
                      />
                      <span className="w-4 h-1 rounded-full shrink-0" style={{ background: route.color, opacity: route.opacity }} />
                      <span className="text-xs font-medium text-foreground">{route.name}</span>
                    </label>
                  ))}
                  <hr className="border-card-border" />
                </>
              )}
              {activeGroups.map((group) => (
                <div key={group.key}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleGroups.has(group.key)}
                      onChange={() => toggleGroup(group.key)}
                      className="rounded accent-teal w-3.5 h-3.5"
                    />
                    <span className="text-xs font-medium text-foreground">{group.label}</span>
                  </label>
                  {visibleGroups.has(group.key) && (
                    <div className="text-[11px] text-muted space-y-1.5 pl-5.5 mt-1.5">
                      {group.types.map((key) => {
                        const icon = POI_ICONS[key];
                        if (!icon) return null;
                        // Only show types that have POIs in the current tab
                        const hasPoiOfType = loadedPois.some((poi) => {
                          const cat = (poi as MapPOI & { category?: string }).category || "race";
                          const catMatch = poiCategory === "visitor" ? cat === "visitor" || cat === "both" : cat === "race" || cat === "both";
                          return catMatch && poi.type === key;
                        });
                        if (!hasPoiOfType) return null;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                              style={{ background: icon.color }}
                            >
                              <i className={`ph-bold ph-${icon.icon}`} style={{ color: "white", fontSize: 11 }} />
                            </span>
                            <span>{icon.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* location denied hint */}
      {locationDenied && (
        <div className="absolute bottom-36 left-3 right-3 z-[1000] flex justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-[11px] text-muted flex items-center gap-2 max-w-xs">
            <span>enable location in your browser settings to see your position on the map</span>
            <button onClick={() => setLocationDenied(false)} className="text-card-border hover:text-muted shrink-0">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
