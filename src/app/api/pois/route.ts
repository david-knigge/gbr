import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pois")
    .select("id, name, type, category, position_lat, position_lng, location, hours, description")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    // Fallback to hardcoded data if table doesn't exist or columns missing
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

  return NextResponse.json(
    (data || []).map((p) => ({
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
