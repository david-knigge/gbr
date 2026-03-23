// Points of interest around the race
export interface MapPOI {
  name: string;
  type: "parking" | "registration" | "start" | "finish" | "aid" | "restroom";
  position: [number, number];
  description: string;
}

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

export const POI_ICONS: Record<string, { emoji: string; color: string }> = {
  parking: { emoji: "P", color: "#3b82f6" },
  registration: { emoji: "R", color: "#7B5EA7" },
  start: { emoji: "S", color: "#22c55e" },
  finish: { emoji: "F", color: "#ef4444" },
  aid: { emoji: "+", color: "#f59e0b" },
  restroom: { emoji: "W", color: "#64748b" },
};
