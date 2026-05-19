import { NextResponse } from "next/server";
import { getLocationById } from "@/lib/locations";
import { getMessagesForLocation } from "@/lib/messages";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  const [desk47, desk47Messages] = await Promise.all([
    getLocationById("47"),
    getMessagesForLocation("47"),
  ]);

  return NextResponse.json({
    ok: Boolean(desk47.location),
    app: "MyStudyFriend",
    checkpoint: "hours-2-7",
    supabaseConfigured: hasSupabaseConfig(),
    desk47: {
      source: desk47.source,
      location: desk47.location,
      error: desk47.error,
    },
    desk47Messages: {
      source: desk47Messages.source,
      count: desk47Messages.messages.length,
      error: desk47Messages.error,
    },
  });
}
