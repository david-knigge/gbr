import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [users, scans, donations, unmatchedDonations, ledger] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("scans").select("*", { count: "exact", head: true }),
    supabase.from("donations").select("*", { count: "exact", head: true }),
    supabase.from("donations").select("*", { count: "exact", head: true }).is("user_id", null),
    supabase.from("raffle_entries_ledger").select("delta"),
  ]);

  const totalEntries = (ledger.data || []).reduce((sum, row) => sum + (row.delta || 0), 0);

  return NextResponse.json({
    total_users: users.count ?? 0,
    total_scans: scans.count ?? 0,
    total_donations: donations.count ?? 0,
    total_raffle_entries: totalEntries,
    unmatched_donations: unmatchedDonations.count ?? 0,
  });
}
