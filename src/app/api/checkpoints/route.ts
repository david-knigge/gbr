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

// Cache in memory after first read
let cached: unknown[] | null = null;

export async function GET() {
  if (cached) return NextResponse.json(cached);

  const snapshot = loadSnapshot();
  if (snapshot?.checkpoints?.length) {
    cached = snapshot.checkpoints
      .filter((cp: { is_active: boolean }) => cp.is_active !== false)
      .map((cp: { id: string; name: string; slug: string; sort_order: number | null; position_lat: number | null; position_lng: number | null }) => ({
        id: cp.id,
        name: cp.name,
        slug: cp.slug,
        sort_order: cp.sort_order,
        position_lat: cp.position_lat ?? null,
        position_lng: cp.position_lng ?? null,
      }));
    return NextResponse.json(cached);
  }

  return NextResponse.json([]);
}
