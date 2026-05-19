import { NextResponse } from "next/server";
import { getDisplayAuthorLabel } from "@/lib/author-label";
import { embedText } from "@/lib/openai";
import { enrichMessageBody } from "@/lib/message-enrichment";
import { createAuthorLabel } from "@/lib/pseudonym";
import {
  createServerSupabaseAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { toVectorLiteral } from "@/lib/vector";

const maxMessageLength = 1000;
const messageResponseSelect =
  "id, location_id, body, pseudonym, author_label, tags, course_tags, upvotes, term_week_when_written, created_at";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Message request must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isMessagePayload(payload)) {
    return NextResponse.json(
      { error: "Message request needs a locationId, body, and demoUserId." },
      { status: 400 },
    );
  }

  const locationId = Number(payload.locationId);
  const body = payload.body.trim();
  const demoUserId = payload.demoUserId.trim();

  if (!Number.isInteger(locationId)) {
    return NextResponse.json(
      { error: "Location id must be a whole number." },
      { status: 400 },
    );
  }

  if (!body) {
    return NextResponse.json(
      { error: "Write a message before posting." },
      { status: 400 },
    );
  }

  if (body.length > maxMessageLength) {
    return NextResponse.json(
      { error: `Messages must be ${maxMessageLength} characters or fewer.` },
      { status: 400 },
    );
  }

  if (!demoUserId) {
    return NextResponse.json(
      { error: "Anonymous browser id is missing. Refresh and try again." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured, so messages cannot be saved." },
      { status: 503 },
    );
  }

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .maybeSingle();

  if (locationError) {
    return NextResponse.json(
      { error: locationError.message },
      { status: 500 },
    );
  }

  if (!location) {
    return NextResponse.json(
      { error: "This desk does not exist." },
      { status: 404 },
    );
  }

  let authorLabel: string;

  try {
    authorLabel = createAuthorLabel({ demoUserId, locationId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Anonymous author label could not be created.",
      },
      { status: 500 },
    );
  }

  const enrichment = enrichMessageBody(body);
  const insertWithAuthorLabel = await supabase
    .from("messages")
    .insert({
      location_id: locationId,
      author_label: authorLabel,
      pseudonym: authorLabel,
      body,
      tags: enrichment.tags,
      course_tags: enrichment.courseTags,
      term_week_when_written: enrichment.termWeekWhenWritten,
      status: "public",
    })
    .select(messageResponseSelect)
    .single();

  let data = insertWithAuthorLabel.data;
  let error = insertWithAuthorLabel.error;

  if (isMissingAuthorLabelColumn(error?.message)) {
    const fallbackInsert = await supabase
      .from("messages")
      .insert({
        location_id: locationId,
        pseudonym: authorLabel,
        body,
        tags: enrichment.tags,
        course_tags: enrichment.courseTags,
        term_week_when_written: enrichment.termWeekWhenWritten,
        status: "public",
      })
      .select(messageResponseSelect)
      .single();

    data = fallbackInsert.data;
    error = fallbackInsert.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.id) {
    await embedNewMessageIfConfigured({
      body,
      messageId: data.id,
    });
  }

  const displayAuthorLabel = getDisplayAuthorLabel({
    author_label: data?.author_label,
    pseudonym: data?.pseudonym,
  });
  const responseAuthorLabel =
    displayAuthorLabel === "Anonymous Student" ? authorLabel : displayAuthorLabel;

  return NextResponse.json(
    {
      message: {
        id: data?.id,
        location_id: data?.location_id ?? locationId,
        body: data?.body ?? body,
        pseudonym:
          data?.pseudonym && data.pseudonym !== "Anonymous Student"
            ? data.pseudonym
            : responseAuthorLabel,
        author_label: responseAuthorLabel,
        tags: data?.tags ?? enrichment.tags,
        course_tags: data?.course_tags ?? enrichment.courseTags,
        upvotes: data?.upvotes ?? 0,
        term_week_when_written:
          data?.term_week_when_written ?? enrichment.termWeekWhenWritten,
        created_at: data?.created_at,
      },
    },
    { status: 201 },
  );
}

function isMessagePayload(
  payload: unknown,
): payload is { locationId: string | number; body: string; demoUserId: string } {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybePayload = payload as {
    locationId?: unknown;
    body?: unknown;
    demoUserId?: unknown;
  };

  return (
    (typeof maybePayload.locationId === "string" ||
      typeof maybePayload.locationId === "number") &&
    typeof maybePayload.body === "string" &&
    typeof maybePayload.demoUserId === "string"
  );
}

function isMissingAuthorLabelColumn(message?: string) {
  return Boolean(
    message?.toLowerCase().includes("author_label") &&
      message.toLowerCase().includes("column"),
  );
}

async function embedNewMessageIfConfigured({
  body,
  messageId,
}: {
  body: string;
  messageId: string;
}) {
  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const supabaseAdmin = createServerSupabaseAdminClient();

  if (!supabaseAdmin) {
    return;
  }

  try {
    const embedding = await embedText(body);
    const { error } = await supabaseAdmin
      .from("messages")
      .update({ embedding: toVectorLiteral(embedding) })
      .eq("id", messageId);

    if (error) {
      console.warn("New message embedding was skipped.", {
        reason: getSafeEmbeddingWarning(error.message),
      });
    }
  } catch (error) {
    console.warn("New message embedding was skipped.", {
      reason:
        error instanceof Error
          ? getSafeEmbeddingWarning(error.message)
          : "Unknown embedding failure.",
    });
  }
}

function getSafeEmbeddingWarning(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("quota") || normalizedMessage.includes("billing")) {
    return "OpenAI quota or billing is unavailable.";
  }

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("403")
  ) {
    return "OpenAI API key was rejected.";
  }

  if (
    normalizedMessage.includes("embedding") ||
    normalizedMessage.includes("schema cache") ||
    normalizedMessage.includes("column")
  ) {
    return "Embedding column is not ready.";
  }

  return "Embedding request failed.";
}
