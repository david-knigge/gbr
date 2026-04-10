// Points of interest around the race
export interface MapPOI {
  name: string;
  type: string;
  category: "race" | "visitor" | "both";
  position: [number, number];
  location: string;         // always shown, links to google maps
  gmaps_url?: string | null; // direct Google Maps link (overrides search)
  hours?: string | null;    // optional time/hours row
  description?: string | null; // optional extra detail
}

// Hardcoded fallback — the app will try to load from Supabase first
export const POIS: MapPOI[] = [
  {
    name: "Registration & Packet Pickup",
    type: "registration",
    category: "race",
    position: [38.0494, -122.1586],
    location: "first street green",
    hours: "opens 7:00 AM",
  },
  {
    name: "Start / Finish Line",
    type: "start",
    category: "race",
    position: [38.04567, -122.1612],
    location: "first street near the waterfront",
  },
  {
    name: "Aid Station 1",
    type: "aid",
    category: "race",
    position: [38.0510, -122.1550],
    location: "~1.5 mi mark",
    description: "water and electrolytes",
  },
  {
    name: "Street Parking",
    type: "parking",
    category: "both",
    position: [38.0488, -122.1570],
    location: "first street",
    description: "free, arrive early",
  },
  {
    name: "City Parking Lot",
    type: "parking",
    category: "both",
    position: [38.0478, -122.1575],
    location: "east 2nd st",
    description: "5 min walk to start",
  },
  {
    name: "Restrooms",
    type: "restroom",
    category: "both",
    position: [38.0492, -122.1600],
    location: "near registration area",
  },
];

// ── Phosphor icon class + per-type background color ──
export interface POIIconConfig {
  icon: string;
  label: string;
  color: string;
}

export const POI_ICONS: Record<string, POIIconConfig> = {
  // race
  registration: { icon: "clipboard-text",   label: "registration",   color: "#4DBFB3" },
  start:        { icon: "flag-banner",       label: "start / finish", color: "#E8643B" },
  finish:       { icon: "flag-checkered",    label: "start / finish", color: "#E8643B" },
  aid:          { icon: "drop",              label: "aid station",    color: "#5B9BD5" },
  restroom:     { icon: "toilet",            label: "restrooms",      color: "#8a8a9a" },

  // shared
  parking:      { icon: "letter-circle-p",    label: "parking",        color: "#5B73A8" },

  // visitor: food & drink
  restaurant:   { icon: "fork-knife",        label: "restaurant",     color: "#D4764E" },
  cafe:         { icon: "coffee",            label: "cafe",           color: "#A0785A" },
  bar:          { icon: "wine",              label: "bar / wine",     color: "#8B5E83" },
  bakery:       { icon: "bread",             label: "bakery",         color: "#C4956A" },

  // visitor: shops & services
  retail:       { icon: "storefront",        label: "shop",           color: "#7B5EA7" },
  gallery:      { icon: "paint-brush",       label: "gallery / art",  color: "#B06EA7" },
  service:      { icon: "scissors",          label: "services",       color: "#6B8E8E" },

  // visitor: sights
  historic:     { icon: "bank",              label: "historic",       color: "#7A6F5E" },
  park:         { icon: "tree",              label: "park / green",   color: "#5A9E6F" },
  viewpoint:    { icon: "binoculars",        label: "viewpoint",      color: "#4A8B9E" },
  marina:       { icon: "anchor",            label: "waterfront",     color: "#3D7A9E" },

  // general
  stand:        { icon: "hamburger",         label: "food stand",     color: "#D4764E" },
  info:         { icon: "info",              label: "info",           color: "#8a8a9a" },
  other:        { icon: "map-pin",           label: "other",          color: "#8a8a9a" },
};

export const RACE_LEGEND_TYPES = ["registration", "start", "aid", "restroom", "parking"];
export const VISITOR_LEGEND_TYPES = ["parking", "restaurant", "cafe", "bar", "retail", "gallery", "historic", "park", "viewpoint", "marina", "restroom"];

// Grouped legend categories for toggle controls
export const POI_GROUPS = [
  { key: "utilities", label: "utilities", types: ["registration", "start", "finish", "aid", "restroom", "parking"], defaultOn: true },
  { key: "sights",    label: "sights",    types: ["historic", "park", "viewpoint", "marina"],                       defaultOn: true },
  { key: "dining",    label: "food & shops", types: ["restaurant", "cafe", "bar", "bakery", "retail", "gallery", "service"], defaultOn: false },
];
