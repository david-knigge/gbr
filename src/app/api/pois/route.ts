import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

function loadSnapshot() {
  try {
    const raw = readFileSync(join(process.cwd(), "public/data/snapshot.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  // Primary: snapshot.json (committed static file, zero DB calls)
  const snapshot = loadSnapshot();
  if (snapshot?.pois?.length) {
    return NextResponse.json(
      snapshot.pois
        .filter((p: { is_active: boolean }) => p.is_active !== false)
        .map((p: { name: string; type: string; category?: string; position_lat: number; position_lng: number; location?: string; gmaps_url?: string; hours?: string; description?: string }) => ({
          id: p.name,
          name: p.name,
          type: p.type,
          category: p.category || "race",
          position: [p.position_lat, p.position_lng],
          location: p.location || "",
          gmaps_url: p.gmaps_url || null,
          hours: p.hours || null,
          description: p.description || null,
        }))
    );
  }

  // Fallback: hardcoded defaults
  const { POIS } = await import("@/lib/map-data");
  return NextResponse.json(
    POIS.map((p) => ({
      id: p.name,
      name: p.name,
      type: p.type,
      category: p.category,
      position: p.position,
      location: p.location,
      gmaps_url: p.gmaps_url || null,
      hours: p.hours || null,
      description: p.description || null,
    }))
  );
}
