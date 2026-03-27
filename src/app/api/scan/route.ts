import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound, serverError, getSupabaseAdmin } from "@/lib/api-helpers";
import { scanSchema } from "@/lib/validation";

// Simplified scan — just looks up checkpoint + question by QR token
// No user required, progress tracked client-side in localStorage
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid scan data");
    }

    const supabase = getSupabaseAdmin();
    const { qr_token } = parsed.data;

    // Look up checkpoint
    const { data: checkpoint } = await supabase
      .from("checkpoints")
      .select("id, name, slug, description, question_id, position_lat, position_lng")
      .eq("qr_token", qr_token)
      .eq("is_active", true)
      .single();

    if (!checkpoint) {
      return notFound("Checkpoint not found");
    }

    // Load question if assigned
    let question = null;
    if (checkpoint.question_id) {
      const { data: q } = await supabase
        .from("questions")
        .select("id, prompt, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation")
        .eq("id", checkpoint.question_id)
        .single();
      question = q;
    }

    return NextResponse.json({
      checkpoint: {
        id: checkpoint.id,
        name: checkpoint.name,
        slug: checkpoint.slug,
        description: checkpoint.description,
      },
      question,
    });
  } catch (e) {
    return serverError(`Scan error: ${e}`);
  }
}
