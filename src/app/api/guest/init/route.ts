import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, badRequest, serverError } from "@/lib/api-helpers";
import { guestInitSchema } from "@/lib/validation";
import { APP_CODE_PREFIX } from "@/lib/constants";

function generateAppCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${APP_CODE_PREFIX}-${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = guestInitSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request");
    }

    const supabase = getSupabaseAdmin();
    const { user_id } = parsed.data;

    // Returning user
    if (user_id) {
      const { data: existing } = await supabase
        .from("users")
        .select("id, app_code")
        .eq("id", user_id)
        .single();

      if (existing) {
        return NextResponse.json({
          user_id: existing.id,
          app_code: existing.app_code,
        });
      }
    }

    // New user — generate unique app code with retry
    let appCode = generateAppCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: conflict } = await supabase
        .from("users")
        .select("id")
        .eq("app_code", appCode)
        .single();

      if (!conflict) break;
      appCode = generateAppCode();
      attempts++;
    }

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({ app_code: appCode })
      .select("id, app_code")
      .single();

    if (error) {
      return serverError(`Failed to create user: ${error.message}`);
    }

    return NextResponse.json({
      user_id: newUser.id,
      app_code: newUser.app_code,
    });
  } catch (e) {
    return serverError(`Guest init error: ${e}`);
  }
}
