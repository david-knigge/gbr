import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized, badRequest, serverError, getSupabaseAdmin } from "@/lib/api-helpers";
import { profileUpdateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid profile data");
    }

    const supabase = getSupabaseAdmin();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (parsed.data.nickname !== undefined) updates.nickname = parsed.data.nickname;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, app_code, nickname, email")
      .single();

    if (error) {
      return serverError(`Profile update failed: ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (e) {
    return serverError(`Profile error: ${e}`);
  }
}
