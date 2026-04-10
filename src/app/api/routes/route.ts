import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";

async function fetchRoutes() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("routes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return data || [];
}

export async function GET() {
  const routes = await cached("routes", fetchRoutes);
  return NextResponse.json(routes);
}
