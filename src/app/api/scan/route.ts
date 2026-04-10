import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound, serverError } from "@/lib/api-helpers";
import { scanSchema } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";

interface Checkpoint {
  id: string;
  name: string;
  slug: string;
  qr_token: string;
  description: string | null;
  question_id: string | null;
  is_active: boolean;
}

interface Question {
  id: string;
  prompt: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string | null;
  correct_answer: string;
  explanation: string;
}

async function fetchScanData() {
  const supabase = getSupabaseAdmin();
  const [cpResult, qResult] = await Promise.all([
    supabase.from("checkpoints").select("*").eq("is_active", true),
    supabase.from("questions").select("*").eq("is_active", true),
  ]);
  return {
    checkpoints: (cpResult.data || []) as Checkpoint[],
    questions: (qResult.data || []) as Question[],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid scan data");
    }

    const { qr_token } = parsed.data;
    const { checkpoints, questions } = await cached("scan-data", fetchScanData);

    const cp = checkpoints.find((c) => c.qr_token === qr_token);
    if (!cp) {
      return notFound("Checkpoint not found");
    }

    const question = cp.question_id
      ? questions.find((q) => q.id === cp.question_id) || null
      : null;

    return NextResponse.json({
      checkpoint: { id: cp.id, name: cp.name, slug: cp.slug, description: cp.description },
      question,
    });
  } catch (e) {
    return serverError(`Scan error: ${e}`);
  }
}
