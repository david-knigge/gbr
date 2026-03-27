import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
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
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pois")
    .select("id, name, type, category, position_lat, position_lng, location, hours, description")
    .eq("is_active", true)
    .order("sort_order");

  if (!error && data) {
    return NextResponse.json(
      data.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category || "race",
        position: [p.position_lat, p.position_lng] as [number, number],
        location: p.location || "",
        hours: p.hours || null,
        description: p.description || null,
      }))
    );
  }

  // Fallback 1: snapshot.json from admin export
  const snapshot = loadSnapshot();
  if (snapshot?.pois) {
    return NextResponse.json(
      snapshot.pois
        .filter((p: { is_active: boolean }) => p.is_active !== false)
        .map((p: { name: string; type: string; category?: string; position_lat: number; position_lng: number; location?: string; hours?: string; description?: string }) => ({
          id: p.name,
          name: p.name,
          type: p.type,
          category: p.category || "race",
          position: [p.position_lat, p.position_lng],
          location: p.location || "",
          hours: p.hours || null,
          description: p.description || null,
        }))
    );
  }

  // Fallback 2: hardcoded
  const { POIS } = await import("@/lib/map-data");
  return NextResponse.json(
    POIS.map((p) => ({
      id: p.name,
      name: p.name,
      type: p.type,
      category: p.category,
      position: p.position,
      location: p.location,
      hours: p.hours || null,
      description: p.description || null,
    }))
  );
}
