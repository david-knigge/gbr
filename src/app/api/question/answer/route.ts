import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized, badRequest, notFound, serverError, getSupabaseAdmin } from "@/lib/api-helpers";
import { answerSchema } from "@/lib/validation";
import { awardQuestionBonus, getUserTotal } from "@/lib/rewards";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid answer data");
    }

    const supabase = getSupabaseAdmin();
    const { checkpoint_id, question_id, selected_answer } = parsed.data;

    // Verify user has scanned this checkpoint
    const { data: scan } = await supabase
      .from("scans")
      .select("id")
      .eq("user_id", userId)
      .eq("checkpoint_id", checkpoint_id)
      .single();

    if (!scan) {
      return badRequest("Must scan checkpoint before answering");
    }

    // Check for existing attempt (idempotent)
    const { data: existingAttempt } = await supabase
      .from("question_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("checkpoint_id", checkpoint_id)
      .single();

    if (existingAttempt) {
      // Return cached result
      const { data: question } = await supabase
        .from("questions")
        .select("correct_answer, explanation")
        .eq("id", question_id)
        .single();

      const total = await getUserTotal(supabase, userId);

      return NextResponse.json({
        is_correct: existingAttempt.is_correct,
        correct_answer: question?.correct_answer || existingAttempt.selected_answer,
        explanation: question?.explanation || "",
        entries_awarded: 0,
        new_total: total,
      });
    }

    // Load question
    const { data: question } = await supabase
      .from("questions")
      .select("id, correct_answer, explanation")
      .eq("id", question_id)
      .single();

    if (!question) {
      return notFound("Question not found");
    }

    const isCorrect = selected_answer === question.correct_answer;

    // Insert attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("question_attempts")
      .insert({
        user_id: userId,
        checkpoint_id,
        question_id,
        selected_answer,
        is_correct: isCorrect,
      })
      .select("id")
      .single();

    if (attemptError) {
      // Handle race condition on duplicate
      if (attemptError.code === "23505") {
        const total = await getUserTotal(supabase, userId);
        return NextResponse.json({
          is_correct: isCorrect,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          entries_awarded: 0,
          new_total: total,
        });
      }
      return serverError(`Attempt insert failed: ${attemptError.message}`);
    }

    let entriesAwarded = 0;
    if (isCorrect) {
      entriesAwarded = await awardQuestionBonus(supabase, userId, attempt.id);
    }

    const total = await getUserTotal(supabase, userId);

    return NextResponse.json({
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      entries_awarded: entriesAwarded,
      new_total: total,
    });
  } catch (e) {
    return serverError(`Answer error: ${e}`);
  }
}
