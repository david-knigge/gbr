import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export function getUserId(req: NextRequest): string | null {
  return req.headers.get("x-user-id");
}

export function unauthorized() {
  return NextResponse.json({ error: "Missing user identity" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message: string) {
  console.error(message);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export { getSupabaseAdmin };
