import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Exports POIs and checkpoints+questions as a single JSON bundle
// Admin downloads this and commits to public/data/snapshot.json
export async function GET() {
  const supabase = getSupabaseAdmin();
  const errors: string[] = [];

  const [poisResult, checkpointsResult, questionsResult, routesResult] = await Promise.all([
    supabase.from("pois").select("*").order("sort_order"),
    supabase.from("checkpoints").select("*").order("sort_order"),
    supabase.from("questions").select("*"),
    supabase.from("routes").select("*").order("sort_order"),
  ]);

  if (poisResult.error) errors.push(`pois: ${poisResult.error.message}`);
  if (checkpointsResult.error) errors.push(`checkpoints: ${checkpointsResult.error.message}`);
  if (questionsResult.error) errors.push(`questions: ${questionsResult.error.message}`);
  if (routesResult.error) errors.push(`routes: ${routesResult.error.message}`);

  if (errors.length === 4) {
    return NextResponse.json({ error: "Export failed", details: errors }, { status: 500 });
  }

  const snapshot = {
    exported_at: new Date().toISOString(),
    pois: poisResult.data || [],
    checkpoints: checkpointsResult.data || [],
    questions: questionsResult.data || [],
    routes: routesResult.data || [],
  };

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="snapshot.json"',
    },
  });
}
