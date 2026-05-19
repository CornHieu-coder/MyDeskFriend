import { NextResponse } from "next/server";
import { getDisplayAuthorLabel } from "@/lib/author-label";
import { createAuthorLabel } from "@/lib/pseudonym";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const maxMessageLength = 1000;

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

  const insertWithAuthorLabel = await supabase
    .from("messages")
    .insert({
      location_id: locationId,
      author_label: authorLabel,
      pseudonym: authorLabel,
      body,
      tags: [],
      course_tags: [],
      status: "public",
    })
    .select("*")
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
        tags: [],
        course_tags: [],
        status: "public",
      })
      .select("*")
      .single();

    data = fallbackInsert.data;
    error = fallbackInsert.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
