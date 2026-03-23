import { NextRequest, NextResponse } from "next/server";
import { getUserId, serverError, getSupabaseAdmin } from "@/lib/api-helpers";
import type { CheckpointProgress } from "@/lib/types";

// Cache checkpoints in memory — they don't change during the race
let cachedCheckpoints: { id: string; name: string; slug: string; sort_order: number | null; position_lat: number | null; position_lng: number | null }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

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

  if (error) throw error;
  cachedCheckpoints = data || [];
  cacheTime = Date.now();
  return cachedCheckpoints;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const checkpoints = await getCheckpoints();

    let completedIds = new Set<string>();
    if (userId) {
      const supabase = getSupabaseAdmin();
      const { data: scans } = await supabase
        .from("scans")
        .select("checkpoint_id")
        .eq("user_id", userId);
      completedIds = new Set((scans || []).map((s) => s.checkpoint_id));
    }

    const result: CheckpointProgress[] = checkpoints.map((cp) => ({
      id: cp.id,
      name: cp.name,
      slug: cp.slug,
      sort_order: cp.sort_order,
      is_completed: completedIds.has(cp.id),
      position_lat: cp.position_lat,
      position_lng: cp.position_lng,
    }));

    return NextResponse.json(result);
  } catch (e) {
    return serverError(`Checkpoints error: ${e}`);
  }
}
