import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invalidateCache } from "@/lib/cache";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  const body = await req.json();
  const { name, type, color, weight, opacity, dash_array, label, points, is_active, sort_order } = body;

  const { data, error } = await supabase
    .from("routes")
    .update({
      name,
      type: type || "course",
      color: color || "#E8643B",
      weight: weight ?? 6,
      opacity: opacity ?? 0.9,
      dash_array: dash_array || null,
      label: label || null,
      points,
      is_active,
      sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCache("routes");
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;

  const { error } = await supabase.from("routes").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCache("routes");
  return NextResponse.json({ ok: true });
}
