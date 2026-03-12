import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/sessions - list sessions for an access code
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessCode = searchParams.get("code");
  if (!accessCode) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("cc_sessions")
    .select("id, title, created_at, updated_at")
    .eq("access_code", accessCode)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/sessions - create a new session
export async function POST(req: Request) {
  const { accessCode, title } = await req.json();
  if (!accessCode) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("cc_sessions")
    .insert({ access_code: accessCode, title: title || "New Chat" })
    .select("id, title, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
