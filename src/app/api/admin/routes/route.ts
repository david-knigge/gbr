import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invalidateCache } from "@/lib/cache";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { name, type, color, weight, opacity, dash_array, label, points, sort_order } = body;

  if (!name || !points) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("routes")
    .insert({
      name,
      type: type || "course",
      color: color || "#E8643B",
      weight: weight ?? 6,
      opacity: opacity ?? 0.9,
      dash_array: dash_array || null,
      label: label || null,
      points,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCache("routes");
  return NextResponse.json(data, { status: 201 });
}
