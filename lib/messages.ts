import { getDemoMessagesForLocation, type DemoMessage } from "@/lib/demoData";
import { getDisplayAuthorLabel } from "@/lib/author-label";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MessageRecord = DemoMessage;

export type MessageLookupResult = {
  messages: MessageRecord[];
  source: "supabase" | "seed-fallback";
  error?: string;
};

const messageSelect =
  "*";
const messageFetchLimit = 150;

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
    .limit(messageFetchLimit);

  if (error) {
    return {
      messages: fallback,
      source: "seed-fallback",
      error: error.message,
    };
  }

  return {
    messages: (data ?? []).map(normalizeMessage),
    source: "supabase",
  };
}

function normalizeMessage(message: MessageRecord): MessageRecord {
  const authorLabel = getDisplayAuthorLabel(message);

  return {
    ...message,
    author_label: authorLabel,
    pseudonym: message.pseudonym || authorLabel,
    tags: message.tags ?? [],
    course_tags: message.course_tags ?? [],
    upvotes: message.upvotes ?? 0,
  };
}
