import { NextResponse } from "next/server";
import { serverError, getSupabaseAdmin } from "@/lib/api-helpers";
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

// Cache checkpoints in memory
let cachedCheckpoints: { id: string; name: string; slug: string; sort_order: number | null; position_lat: number | null; position_lng: number | null }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

async function getCheckpoints() {
  if (cachedCheckpoints && Date.now() - cacheTime < CACHE_TTL) {
    return cachedCheckpoints;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("checkpoints")
    .select("id, name, slug, sort_order, position_lat, position_lng")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!error && data) {
    cachedCheckpoints = data.map((cp) => ({
      id: cp.id,
      name: cp.name,
      slug: cp.slug,
      sort_order: cp.sort_order,
      position_lat: cp.position_lat ?? null,
      position_lng: cp.position_lng ?? null,
    }));
    cacheTime = Date.now();
    return cachedCheckpoints;
  }

  // Fallback: snapshot.json
  const snapshot = loadSnapshot();
  if (snapshot?.checkpoints) {
    cachedCheckpoints = snapshot.checkpoints
      .filter((cp: { is_active: boolean }) => cp.is_active !== false)
      .map((cp: { id: string; name: string; slug: string; sort_order: number | null; position_lat: number | null; position_lng: number | null }) => ({
        id: cp.id,
        name: cp.name,
        slug: cp.slug,
        sort_order: cp.sort_order,
        position_lat: cp.position_lat ?? null,
        position_lng: cp.position_lng ?? null,
      }));
    cacheTime = Date.now();
    return cachedCheckpoints;
  }

  return [];
}

export async function GET() {
  try {
    const checkpoints = await getCheckpoints();
    return NextResponse.json(checkpoints);
  } catch (e) {
    return serverError(`Checkpoints error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
