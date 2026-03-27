import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Exports POIs and checkpoints+questions as a single JSON bundle
// Admin downloads this and commits to public/data/snapshot.json
export async function GET() {
  const supabase = getSupabaseAdmin();

  const [poisResult, checkpointsResult, questionsResult] = await Promise.all([
    supabase
      .from("pois")
      .select("name, type, category, position_lat, position_lng, location, hours, description, sort_order, is_active")
      .order("sort_order"),
    supabase
      .from("checkpoints")
      .select("id, name, slug, qr_token, description, entries_awarded, question_id, is_active, sort_order, position_lat, position_lng")
      .order("sort_order"),
    supabase
      .from("questions")
      .select("id, prompt, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, is_active"),
  ]);

  if (poisResult.error || checkpointsResult.error || questionsResult.error) {
    return NextResponse.json(
      { error: "Export failed", details: [poisResult.error?.message, checkpointsResult.error?.message, questionsResult.error?.message].filter(Boolean) },
      { status: 500 }
    );
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
