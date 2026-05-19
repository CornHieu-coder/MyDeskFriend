import { NextResponse } from "next/server";
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
      { error: "Message request needs a locationId and body." },
      { status: 400 },
    );
  }

  const locationId = Number(payload.locationId);
  const body = payload.body.trim();

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

  const { data, error } = await supabase
    .from("messages")
    .insert({
      location_id: locationId,
      body,
      pseudonym: "Anonymous Student",
      tags: [],
      course_tags: [],
      status: "public",
    })
    .select(
      "id,location_id,author_id,pseudonym,body,tags,course_tags,upvotes,status,term_week_when_written,created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}

function isMessagePayload(
  payload: unknown,
): payload is { locationId: string | number; body: string } {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybePayload = payload as {
    locationId?: unknown;
    body?: unknown;
  };

  return (
    (typeof maybePayload.locationId === "string" ||
      typeof maybePayload.locationId === "number") &&
    typeof maybePayload.body === "string"
  );
}
