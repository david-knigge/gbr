"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { CheckpointProgress } from "@/lib/types";
import { COURSES, type Course } from "@/lib/course-data";
import type { MapPOI } from "@/lib/map-data";
import { POI_ICONS } from "@/lib/map-data";

// Benicia First Street Green area
const RACE_CENTER: [number, number] = [38.0494, -122.1586];
const DEFAULT_ZOOM = 15;

// Checkpoint markers
const checkpointIcon = (completed: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${completed ? "#22c55e" : "#7B5EA7"};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 14px;
    ">${completed ? "&#10003;" : ""}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

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
  const config = POI_ICONS[type] || { emoji: "?", color: "#999" };
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 6px;
      background: ${config.color};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 13px;
    ">${config.emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Get checkpoint positions — use DB positions when available, fall back to algorithmic distribution
function getCheckpointPositions(checkpoints: CheckpointProgress[]): [number, number][] {
  if (checkpoints.length === 0) return [];
  const fiveK = COURSES.find((c) => c.name === "5k");
  const step = fiveK ? Math.floor(fiveK.points.length / (checkpoints.length + 1)) : 0;
  return checkpoints.map((cp, i) => {
    if (cp.position_lat && cp.position_lng) {
      return [cp.position_lat, cp.position_lng];
    }
    return fiveK ? (fiveK.points[(i + 1) * step] || RACE_CENTER) : RACE_CENTER;
  });
}

function LocationTracker({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => onLocationFound([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM),
      () => {}
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, onLocationFound]);

  return null;
}

interface RaceMapProps {
  checkpoints?: CheckpointProgress[];
  pois?: MapPOI[];
  showCourses?: boolean;
  showPOIs?: boolean;
  showCheckpoints?: boolean;
}

export function RaceMap({
  checkpoints = [],
  pois,
  showCourses = true,
  showPOIs = true,
  showCheckpoints = false,
}: RaceMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [visibleCourses, setVisibleCourses] = useState<Set<string>>(
    new Set(COURSES.map((c) => c.name))
  );
  const [legendOpen, setLegendOpen] = useState(false);
  const [poisVisible, setPoisVisible] = useState(true);
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const [loadedPois, setLoadedPois] = useState<MapPOI[]>([]);

  const positions = getCheckpointPositions(checkpoints);

  // Load POIs from API if not provided as prop
  useEffect(() => {
    if (pois) {
      setLoadedPois(pois);
      return;
    }
    fetch("/api/pois")
      .then((r) => (r.ok ? r.json() : []))
      .then(setLoadedPois)
      .catch(() => {});
  }, [pois]);

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

  return (
    <>
      <MapContainer
        center={RACE_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationTracker onLocationFound={handleLocationFound} />

        {/* User location */}
        {userPosition && (
          <>
            <Circle
              center={userPosition}
              radius={30}
              pathOptions={{ color: "#E8643B", fillColor: "#E8643B", fillOpacity: 0.1, weight: 1 }}
            />
            <Marker position={userPosition} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          </>
        )}

        {/* Course polylines — thicker with outline for visibility */}
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
              eventHandlers={{
                mouseover: () => setHoveredCourse(course),
                mouseout: () => setHoveredCourse(null),
              }}
            >
              <Popup>
                <strong>{course.name}</strong>
                Start: {course.startTime}
              </Popup>
            </Polyline>
          ))}

        {/* POI markers */}
        {showPOIs &&
          poisVisible &&
          loadedPois.map((poi) => (
            <Marker key={`${poi.name}-${poi.position[0]}`} position={poi.position} icon={poiIcon(poi.type)}>
              <Popup>
                <strong>{poi.name}</strong>
                {poi.description}
              </Popup>
            </Marker>
          ))}

        {/* Checkpoint markers */}
        {showCheckpoints &&
          checkpoints.map((cp, i) => (
            <Marker
              key={cp.id}
              position={positions[i] || RACE_CENTER}
              icon={checkpointIcon(cp.is_completed)}
            >
              <Popup>
                <strong>{cp.name}</strong>
                {cp.is_completed ? (
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>Completed</span>
                ) : (
                  <span style={{ color: "#7B5EA7", fontWeight: 700 }}>Not yet scanned</span>
                )}
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Course hover tooltip */}
      {hoveredCourse && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1100] bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2.5 shadow-lg text-sm pointer-events-none">
          <span className="font-bold" style={{ color: hoveredCourse.color }}>
            {hoveredCourse.name}
          </span>
          <span className="text-muted ml-3 font-medium">{hoveredCourse.startTime}</span>
        </div>
      )}

      {/* Legend toggle */}
      {showCourses && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="bg-white/95 backdrop-blur-sm rounded-lg px-3.5 py-2.5 shadow-lg text-xs font-bold text-foreground tracking-wide flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Legend
          </button>
          {legendOpen && (
            <div className="mt-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 space-y-2.5 min-w-[200px]">
              <div className="text-[10px] font-bold text-muted tracking-wide">Courses</div>
              {COURSES.map((course) => (
                <label key={course.name} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCourses.has(course.name)}
                    onChange={() => toggleCourse(course.name)}
                    className="rounded accent-teal"
                  />
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: course.color }}
                  />
                  <span className="text-xs font-semibold text-foreground">{course.name}</span>
                  <span className="text-[10px] text-muted ml-auto font-medium">{course.startTime}</span>
                </label>
              ))}
              <hr className="border-card-border" />
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={poisVisible}
                  onChange={() => setPoisVisible(!poisVisible)}
                  className="rounded accent-teal"
                />
                <span className="text-xs font-semibold text-foreground">Info Points</span>
              </label>
              {poisVisible && (
                <div className="text-[11px] text-muted space-y-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#3b82f6" }}>P</span>
                    <span className="font-medium">Parking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#7B5EA7" }}>R</span>
                    <span className="font-medium">Registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#22c55e" }}>S</span>
                    <span className="font-medium">Start / Finish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#f59e0b" }}>+</span>
                    <span className="font-medium">Aid Station</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#64748b" }}>W</span>
                    <span className="font-medium">Restrooms</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
