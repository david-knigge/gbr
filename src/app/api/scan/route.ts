import { NextRequest, NextResponse } from "next/server";
import { badRequest, notFound, serverError } from "@/lib/api-helpers";
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

// Looks up checkpoint + question by QR token from snapshot.json
// No database calls, no user required
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid scan data");
    }

    const { qr_token } = parsed.data;
    const snapshot = loadSnapshot();

    if (!snapshot?.checkpoints) {
      return notFound("No checkpoint data available");
    }

    const cp = snapshot.checkpoints.find(
      (c: { qr_token: string; is_active: boolean }) => c.qr_token === qr_token && c.is_active !== false
    );

    if (!cp) {
      return notFound("Checkpoint not found");
    }

    const question = cp.question_id
      ? snapshot.questions?.find((q: { id: string }) => q.id === cp.question_id) || null
      : null;

    return NextResponse.json({
      checkpoint: { id: cp.id, name: cp.name, slug: cp.slug, description: cp.description },
      question,
    });
  } catch (e) {
    return serverError(`Scan error: ${e}`);
  }
}
