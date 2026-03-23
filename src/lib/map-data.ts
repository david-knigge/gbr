// Points of interest around the race
export interface MapPOI {
  name: string;
  type: string;
  position: [number, number];
  description: string;
}

// Hardcoded fallback — the app will try to load from Supabase first
export const POIS: MapPOI[] = [
  {
    name: "Registration & Packet Pickup",
    type: "registration",
    position: [38.0494, -122.1586],
    description: "First Street Green — opens 7:00 AM",
  },
  {
    name: "Start / Finish Line",
    type: "start",
    position: [38.04567, -122.1612],
    description: "On First Street near the waterfront",
  },
  {
    name: "Street Parking — First Street",
    type: "parking",
    position: [38.0488, -122.1570],
    description: "Free street parking, arrive early",
  },
  {
    name: "City Parking Lot — East 2nd St",
    type: "parking",
    position: [38.0478, -122.1575],
    description: "5 min walk to start line",
  },
  {
    name: "Aid Station 1",
    type: "aid",
    position: [38.0510, -122.1550],
    description: "Water and electrolytes",
  },
  {
    name: "Restrooms",
    type: "restroom",
    position: [38.0492, -122.1600],
    description: "Near registration area",
  },
];

const POI_BG = "#3a3a4a";

export const POI_ICONS: Record<string, { emoji: string; color: string }> = {
  parking: { emoji: "🅿", color: POI_BG },
  registration: { emoji: "📋", color: POI_BG },
  start: { emoji: "🏁", color: POI_BG },
  finish: { emoji: "🏁", color: POI_BG },
  aid: { emoji: "💧", color: POI_BG },
  restroom: { emoji: "🚾", color: POI_BG },
  stand: { emoji: "🌭", color: POI_BG },
  info: { emoji: "i", color: POI_BG },
  other: { emoji: "?", color: POI_BG },
};
