import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized, badRequest, notFound, serverError, getSupabaseAdmin } from "@/lib/api-helpers";
import { scanSchema } from "@/lib/validation";
import { awardScanEntries, checkAndAwardMilestones, getUserTotal } from "@/lib/rewards";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

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
      .select("id, name, slug, description, entries_awarded, question_id")
      .eq("qr_token", qr_token)
      .eq("is_active", true)
      .single();

    if (!checkpoint) {
      return notFound("Checkpoint not found");
    }

    // Check for existing scan
    const { data: existingScan } = await supabase
      .from("scans")
      .select("id")
      .eq("user_id", userId)
      .eq("checkpoint_id", checkpoint.id)
      .single();

    // Load question if assigned
    let question = null;
    if (checkpoint.question_id) {
      const { data: q } = await supabase
        .from("questions")
        .select("id, prompt, answer_a, answer_b, answer_c, answer_d")
        .eq("id", checkpoint.question_id)
        .single();
      question = q;
    }

    if (existingScan) {
      // Check if they already answered the question
      const { data: existingAttempt } = await supabase
        .from("question_attempts")
        .select("id")
        .eq("user_id", userId)
        .eq("checkpoint_id", checkpoint.id)
        .single();

      const total = await getUserTotal(supabase, userId);

      return NextResponse.json({
        already_scanned: true,
        checkpoint: {
          id: checkpoint.id,
          name: checkpoint.name,
          slug: checkpoint.slug,
          description: checkpoint.description,
        },
        entries_awarded: 0,
        question: existingAttempt ? null : question,
        new_total: total,
        milestone_earned: null,
      });
    }

    // Insert scan
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({ user_id: userId, checkpoint_id: checkpoint.id })
      .select("id")
      .single();

    if (scanError) {
      // Handle race condition on duplicate
      if (scanError.code === "23505") {
        const total = await getUserTotal(supabase, userId);
        return NextResponse.json({
          already_scanned: true,
          checkpoint: {
            id: checkpoint.id,
            name: checkpoint.name,
            slug: checkpoint.slug,
            description: checkpoint.description,
          },
          entries_awarded: 0,
          question,
          new_total: total,
          milestone_earned: null,
        });
      }
      return serverError(`Scan insert failed: ${scanError.message}`);
    }

    // Award scan entries
    const { entries } = await awardScanEntries(
      supabase,
      userId,
      checkpoint.id,
      scan.id,
      checkpoint.entries_awarded
    );

    // Check milestones
    const milestoneBonus = await checkAndAwardMilestones(supabase, userId);

    const total = await getUserTotal(supabase, userId);

    return NextResponse.json({
      already_scanned: false,
      checkpoint: {
        id: checkpoint.id,
        name: checkpoint.name,
        slug: checkpoint.slug,
        description: checkpoint.description,
      },
      entries_awarded: entries,
      question,
      new_total: total,
      milestone_earned: milestoneBonus,
    });
  } catch (e) {
    return serverError(`Scan error: ${e}`);
  }
}
