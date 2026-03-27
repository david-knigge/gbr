import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  const body = await req.json();
  const { name, type, category, position_lat, position_lng, location, hours, description, is_active, sort_order } = body;

  const { data, error } = await supabase
    .from("pois")
    .update({
      name,
      type,
      category: category || "race",
      position_lat,
      position_lng,
      location: location || "",
      hours: hours || null,
      description: description || null,
      is_active,
      sort_order,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;

  const { error } = await supabase.from("pois").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
