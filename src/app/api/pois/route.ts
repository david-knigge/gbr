import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";

async function fetchPois() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("pois")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    category: p.category || "race",
    position: [p.position_lat, p.position_lng],
    location: p.location || "",
    gmaps_url: p.gmaps_url || null,
    hours: p.hours || null,
    description: p.description || null,
  }));
}

export async function GET() {
  const pois = await cached("pois", fetchPois);
  return NextResponse.json(pois);
}
