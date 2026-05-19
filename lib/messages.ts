import { getDemoMessagesForLocation, type DemoMessage } from "@/lib/demoData";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MessageRecord = DemoMessage;

export type MessageLookupResult = {
  messages: MessageRecord[];
  source: "supabase" | "seed-fallback";
  error?: string;
};

const messageSelect =
  "id,location_id,author_id,pseudonym,body,tags,course_tags,upvotes,status,term_week_when_written,created_at";

export async function getMessagesForLocation(
  locationId: string,
): Promise<MessageLookupResult> {
  const fallback = getDemoMessagesForLocation(locationId);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      messages: fallback,
      source: "seed-fallback",
      error: "Supabase env vars are not configured.",
    };
  }

  const id = Number(locationId);

  if (!Number.isInteger(id)) {
    return {
      messages: [],
      source: "seed-fallback",
      error: "Location id must be a whole number.",
    };
  }

  const { data, error } = await supabase
    .from("messages")
    .select(messageSelect)
    .eq("location_id", id)
    .eq("status", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      messages: fallback,
      source: "seed-fallback",
      error: error.message,
    };
  }

  return {
    messages: data ?? [],
    source: "supabase",
  };
}
