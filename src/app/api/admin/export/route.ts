import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Exports POIs and checkpoints+questions as a single JSON bundle
// Admin downloads this and commits to public/data/snapshot.json
export async function GET() {
  const supabase = getSupabaseAdmin();
  const errors: string[] = [];

  const [poisResult, checkpointsResult, questionsResult] = await Promise.all([
    supabase.from("pois").select("*").order("sort_order"),
    supabase.from("checkpoints").select("*").order("sort_order"),
    supabase.from("questions").select("*"),
  ]);

  if (poisResult.error) errors.push(`pois: ${poisResult.error.message}`);
  if (checkpointsResult.error) errors.push(`checkpoints: ${checkpointsResult.error.message}`);
  if (questionsResult.error) errors.push(`questions: ${questionsResult.error.message}`);

  if (errors.length === 3) {
    return NextResponse.json({ error: "Export failed", details: errors }, { status: 500 });
  }

  const snapshot = {
    exported_at: new Date().toISOString(),
    pois: poisResult.data || [],
    checkpoints: checkpointsResult.data || [],
    questions: questionsResult.data || [],
  };

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="snapshot.json"',
    },
  });
}
