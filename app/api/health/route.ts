import { NextResponse } from "next/server";
import { getLocationById } from "@/lib/locations";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  const desk47 = await getLocationById("47");

  return NextResponse.json({
    ok: Boolean(desk47.location),
    app: "MyStudyFriend",
    checkpoint: "hours-0-2",
    supabaseConfigured: hasSupabaseConfig(),
    desk47: {
      source: desk47.source,
      location: desk47.location,
      error: desk47.error,
    },
  });
}
