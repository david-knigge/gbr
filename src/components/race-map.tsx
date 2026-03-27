"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { COURSES } from "@/lib/course-data";
import type { MapPOI, POIIconConfig } from "@/lib/map-data";
import { POI_ICONS, RACE_LEGEND_TYPES, VISITOR_LEGEND_TYPES } from "@/lib/map-data";
import { isCheckpointScanned } from "@/lib/quest-store";

// Benicia First Street Green area
const RACE_CENTER: [number, number] = [38.0494, -122.1586];
const DEFAULT_ZOOM = 15;

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

function poiIcon(type: string) {
  const config: POIIconConfig = POI_ICONS[type] || POI_ICONS.other;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 30px; height: 30px; border-radius: 8px;
      background: ${config.color};
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
    "><i class="ph-bold ph-${config.icon}" style="color:white;font-size:15px;"></i></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// Structured popup — teal dot + bold title, detail lines below
function PopupContent({ title, details }: { title: string; details?: { text: string; type?: "desc" | "time" | "location" | "status" }[] }) {
  return (
    <>
      <span className="popup-title">{title.toLowerCase()}</span>
      {details?.map((d, i) =>
        d.type === "status" ? (
          <span key={i} className="popup-status" dangerouslySetInnerHTML={{ __html: d.text }} />
        ) : (
          <span key={i} className="popup-detail">{d.text}</span>
        )
      )}
    </>
  );
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
  const [visibleCourses, setVisibleCourses] = useState<Set<string>>(
    new Set(COURSES.map((c) => c.name))
  );
  const [legendOpen, setLegendOpen] = useState(false);
  const [poisVisible, setPoisVisible] = useState(true);
  const [loadedPois, setLoadedPois] = useState<MapPOI[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointMarker[]>([]);
  const [locationDenied, setLocationDenied] = useState(false);

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

  const toggleCourse = (name: string) => {
    setVisibleCourses((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Filter POIs by category
  const filteredPois = loadedPois.filter((poi) => {
    const cat = (poi as MapPOI & { category?: string }).category || "race";
    if (poiCategory === "visitor") return cat === "visitor" || cat === "both";
    return cat === "race" || cat === "both";
  });

  const legendTypes = poiCategory === "visitor" ? VISITOR_LEGEND_TYPES : RACE_LEGEND_TYPES;

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
          COURSES.map((course) => (
            <Polyline
              key={`ghost-${course.name}`}
              positions={course.points}
              pathOptions={{
                color: course.color,
                weight: 3,
                opacity: 0.8,
                dashArray: "6 8",
                lineCap: "round",
                lineJoin: "round",
                interactive: false,
              }}
            />
          ))}

        {showCourses &&
          COURSES.filter((c) => visibleCourses.has(c.name)).map((course) => (
            <Polyline
              key={course.name}
              positions={course.points}
              pathOptions={{
                color: course.color,
                weight: 6,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Popup><PopupContent title={course.name} details={[{ text: course.startTime, type: "time" }]} /></Popup>
            </Polyline>
          ))}

        {showPOIs &&
          poisVisible &&
          filteredPois.map((poi) => (
            <Marker key={`${poi.name}-${poi.position[0]}`} position={poi.position} icon={poiIcon(poi.type)}>
              <Popup><PopupContent title={poi.name} details={poi.description ? [{ text: poi.description }] : undefined} /></Popup>
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
                    type: "status",
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
                  {COURSES.map((course) => (
                    <label key={course.name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleCourses.has(course.name)}
                        onChange={() => toggleCourse(course.name)}
                        className="rounded accent-teal w-3.5 h-3.5"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: course.color }}
                      />
                      <span className="text-xs font-medium text-foreground">{course.name}</span>
                      <span className="text-[10px] text-muted ml-auto">{course.startTime}</span>
                    </label>
                  ))}
                  <hr className="border-card-border" />
                </>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={poisVisible}
                  onChange={() => setPoisVisible(!poisVisible)}
                  className="rounded accent-teal w-3.5 h-3.5"
                />
                <span className="text-xs font-medium text-foreground">points of interest</span>
              </label>
              {poisVisible && (
                <div className="text-[11px] text-muted space-y-1.5 pl-0.5">
                  {legendTypes.map((key) => {
                    const icon = POI_ICONS[key];
                    if (!icon) return null;
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
