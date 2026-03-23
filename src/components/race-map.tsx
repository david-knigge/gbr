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

// Distribute checkpoints along the 5k course
function getCheckpointPositions(count: number): [number, number][] {
  const fiveK = COURSES.find((c) => c.name === "5k");
  if (!fiveK || count === 0) return [];
  const step = Math.floor(fiveK.points.length / (count + 1));
  return Array.from({ length: count }, (_, i) => fiveK.points[(i + 1) * step] || RACE_CENTER);
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

  const positions = getCheckpointPositions(checkpoints.length);

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
                <br />
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
                <br />
                <span style={{ fontSize: "12px" }}>{poi.description}</span>
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
                <div style={{ textAlign: "center" }}>
                  <strong>{cp.name}</strong>
                  <br />
                  {cp.is_completed ? (
                    <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 500 }}>Completed</span>
                  ) : (
                    <span style={{ color: "#7B5EA7", fontSize: "12px", fontWeight: 500 }}>Not yet scanned</span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Course hover tooltip */}
      {hoveredCourse && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1100] bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg text-sm pointer-events-none">
          <span className="font-bold" style={{ color: hoveredCourse.color }}>
            {hoveredCourse.name}
          </span>
          <span className="text-muted ml-2">Start: {hoveredCourse.startTime}</span>
        </div>
      )}

      {/* Legend toggle */}
      {showCourses && (
        <div className="absolute top-3 right-3 z-[1000]">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="bg-cream/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-xs font-semibold text-foreground flex items-center gap-1.5 border border-card-border"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Legend
          </button>
          {legendOpen && (
            <div className="mt-1 bg-cream/95 backdrop-blur-sm rounded-lg shadow-lg p-3 space-y-2 min-w-[180px] border border-card-border">
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Courses</div>
              {COURSES.map((course) => (
                <label key={course.name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCourses.has(course.name)}
                    onChange={() => toggleCourse(course.name)}
                    className="rounded accent-teal"
                  />
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: course.color }}
                  />
                  <span className="text-xs font-medium text-foreground">{course.name}</span>
                  <span className="text-[10px] text-muted ml-auto">{course.startTime}</span>
                </label>
              ))}
              <hr className="border-card-border" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={poisVisible}
                  onChange={() => setPoisVisible(!poisVisible)}
                  className="rounded accent-teal"
                />
                <span className="text-xs font-medium text-foreground">Info Points</span>
              </label>
              {poisVisible && (
                <div className="text-[10px] text-muted space-y-1 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#3b82f6" }}>P</span>
                    Parking
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#7B5EA7" }}>R</span>
                    Registration
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#22c55e" }}>S</span>
                    Start / Finish
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#f59e0b" }}>+</span>
                    Aid Station
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#64748b" }}>W</span>
                    Restrooms
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
