import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound, serverError, getSupabaseAdmin } from "@/lib/api-helpers";
import { scanSchema } from "@/lib/validation";
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

// Simplified scan — looks up checkpoint + question by QR token
// No user required, progress tracked client-side
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid scan data");
    }

    const { qr_token } = parsed.data;

    // Try database first
    const supabase = getSupabaseAdmin();
    const { data: checkpoint, error } = await supabase
      .from("checkpoints")
      .select("id, name, slug, description, question_id, position_lat, position_lng")
      .eq("qr_token", qr_token)
      .eq("is_active", true)
      .single();

    if (!error && checkpoint) {
      let question = null;
      if (checkpoint.question_id) {
        const { data: q } = await supabase
          .from("questions")
          .select("id, prompt, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation")
          .eq("id", checkpoint.question_id)
          .single();
        question = q;
      }
      return NextResponse.json({ checkpoint: { id: checkpoint.id, name: checkpoint.name, slug: checkpoint.slug, description: checkpoint.description }, question });
    }

    // Fallback: snapshot.json
    const snapshot = loadSnapshot();
    if (snapshot) {
      const cp = snapshot.checkpoints?.find((c: { qr_token: string; is_active: boolean }) => c.qr_token === qr_token && c.is_active !== false);
      if (cp) {
        const question = cp.question_id
          ? snapshot.questions?.find((q: { id: string }) => q.id === cp.question_id) || null
          : null;
        return NextResponse.json({ checkpoint: { id: cp.id, name: cp.name, slug: cp.slug, description: cp.description }, question });
      }
    }

    return notFound("Checkpoint not found");
  } catch (e) {
    return serverError(`Scan error: ${e}`);
  }
}
