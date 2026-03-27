// Points of interest around the race
export interface MapPOI {
  name: string;
  type: string;
  category: "race" | "visitor" | "both";
  position: [number, number];
  description: string;
}

// Hardcoded fallback — the app will try to load from Supabase first
export const POIS: MapPOI[] = [
  {
    name: "Registration & Packet Pickup",
    type: "registration",
    category: "race",
    position: [38.0494, -122.1586],
    description: "First Street Green — opens 7:00 AM",
  },
  {
    name: "Start / Finish Line",
    type: "start",
    category: "race",
    position: [38.04567, -122.1612],
    description: "on First Street near the waterfront",
  },
  {
    name: "Aid Station 1",
    type: "aid",
    category: "race",
    position: [38.0510, -122.1550],
    description: "water and electrolytes — ~1.5 mi",
  },
  {
    name: "Street Parking — First Street",
    type: "parking",
    category: "both",
    position: [38.0488, -122.1570],
    description: "free street parking, arrive early",
  },
  {
    name: "City Parking Lot — East 2nd St",
    type: "parking",
    category: "both",
    position: [38.0478, -122.1575],
    description: "5 min walk to start line",
  },
  {
    name: "Restrooms",
    type: "restroom",
    category: "both",
    position: [38.0492, -122.1600],
    description: "near registration area",
  },
];

// ── Phosphor icon class + per-type background color ──
// Using Phosphor Bold weight (imported via @phosphor-icons/web/bold)
// Colors chosen to harmonize with the app theme

export interface POIIconConfig {
  icon: string;       // Phosphor Bold class name (without "ph-bold ph-")
  label: string;      // legend label
  color: string;      // marker background
}

export const POI_ICONS: Record<string, POIIconConfig> = {
  // ── race ──
  registration: { icon: "clipboard-text",   label: "registration",   color: "#4DBFB3" },  // teal
  start:        { icon: "flag-banner",       label: "start / finish", color: "#E8643B" },  // coral
  finish:       { icon: "flag-checkered",    label: "start / finish", color: "#E8643B" },
  aid:          { icon: "drop",              label: "aid station",    color: "#5B9BD5" },  // sky blue
  restroom:     { icon: "toilet",            label: "restrooms",      color: "#8a8a9a" },  // muted gray

  // ── shared ──
  parking:      { icon: "car-simple",        label: "parking",        color: "#5B73A8" },  // slate blue

  // ── visitor: food & drink ──
  restaurant:   { icon: "fork-knife",        label: "restaurant",     color: "#D4764E" },  // warm terracotta
  cafe:         { icon: "coffee",            label: "cafe",           color: "#A0785A" },  // coffee brown
  bar:          { icon: "wine",              label: "bar / wine",     color: "#8B5E83" },  // plum
  bakery:       { icon: "bread",             label: "bakery",         color: "#C4956A" },  // golden

  // ── visitor: shops & services ──
  retail:       { icon: "storefront",        label: "shop",           color: "#7B5EA7" },  // primary purple
  gallery:      { icon: "paint-brush",       label: "gallery / art",  color: "#B06EA7" },  // rose purple
  service:      { icon: "scissors",          label: "services",       color: "#6B8E8E" },  // sage

  // ── visitor: sights ──
  historic:     { icon: "bank",              label: "historic",       color: "#7A6F5E" },  // warm stone
  park:         { icon: "tree",              label: "park / green",   color: "#5A9E6F" },  // leaf green
  viewpoint:    { icon: "binoculars",        label: "viewpoint",      color: "#4A8B9E" },  // ocean teal
  marina:       { icon: "anchor",            label: "waterfront",     color: "#3D7A9E" },  // deep ocean

  // ── general ──
  stand:        { icon: "hamburger",         label: "food stand",     color: "#D4764E" },
  info:         { icon: "info",              label: "info",           color: "#8a8a9a" },
  other:        { icon: "map-pin",           label: "other",          color: "#8a8a9a" },
};

// Which icons appear in the race legend vs visitor legend
export const RACE_LEGEND_TYPES = ["registration", "start", "aid", "restroom", "parking"];
export const VISITOR_LEGEND_TYPES = ["parking", "restaurant", "cafe", "bar", "retail", "gallery", "historic", "park", "viewpoint", "marina", "restroom"];
