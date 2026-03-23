import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { awardDonationRewards } from "@/lib/rewards";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { app_code } = await req.json();

  if (!app_code) {
    return NextResponse.json({ error: "app_code is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Find user by app_code
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("app_code", app_code)
    .single();

  if (userErr || !user) {
    return NextResponse.json({ error: "User not found with that app code" }, { status: 404 });
  }

  // Get the donation
  const { data: donation, error: donErr } = await supabase
    .from("donations")
    .select("*")
    .eq("id", id)
    .single();

  if (donErr || !donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  // Update donation with user_id
  const { error: updateErr } = await supabase
    .from("donations")
    .update({ user_id: user.id, race_app_code: app_code })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Award donation rewards
  const rewards = await awardDonationRewards(supabase, user.id, id, donation.amount_cents);

  return NextResponse.json({ ok: true, user_id: user.id, rewards });
}
