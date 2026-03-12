import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from("cc_access_codes")
    .select("id")
    .eq("code", code.trim().toLowerCase())
    .eq("is_active", true)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
