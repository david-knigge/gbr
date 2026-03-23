import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized, serverError, getSupabaseAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("get_user_state", {
      p_user_id: userId,
    });

    if (error || !data) {
      return unauthorized();
    }

    return NextResponse.json(data);
  } catch (e) {
    return serverError(`Get user state error: ${e}`);
  }
}
