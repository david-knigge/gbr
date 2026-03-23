import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Get all users with their raffle totals
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, email, nickname, app_code");

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  const { data: ledger, error: ledgerErr } = await supabase
    .from("raffle_entries_ledger")
    .select("user_id, delta");

  if (ledgerErr) return NextResponse.json({ error: ledgerErr.message }, { status: 500 });

  // Aggregate totals
  const totals: Record<string, number> = {};
  for (const entry of ledger || []) {
    totals[entry.user_id] = (totals[entry.user_id] || 0) + entry.delta;
  }

  // Build CSV
  const lines = ["email,nickname,app_code,total_entries"];
  for (const user of users || []) {
    const total = totals[user.id] || 0;
    if (total <= 0) continue;
    const email = (user.email || "").replace(/"/g, '""');
    const nickname = (user.nickname || "").replace(/"/g, '""');
    lines.push(`"${email}","${nickname}","${user.app_code}",${total}`);
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="raffle-export-${Date.now()}.csv"`,
    },
  });
}
