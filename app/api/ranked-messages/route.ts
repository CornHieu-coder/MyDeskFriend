import { NextResponse } from "next/server";
import { getMessagesForLocation, type MessageRecord } from "@/lib/messages";
import { embedText } from "@/lib/openai";
import {
  buildContextString,
  getSemanticMatchLabel,
  rankMessages,
  type RankedMessage,
  type StudyProfile,
} from "@/lib/ranking";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toVectorLiteral } from "@/lib/vector";

const defaultMatchCount = 50;

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ranked messages request must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRankedMessagesPayload(payload)) {
    return NextResponse.json(
      { error: "Request needs locationId and a profile with courses." },
      { status: 400 },
    );
  }

  const locationId = Number(payload.locationId);

  if (!Number.isInteger(locationId)) {
    return NextResponse.json(
      { error: "Location id must be a whole number." },
      { status: 400 },
    );
  }

  const profile = {
    profileId: payload.profile.profileId,
    displayName: payload.profile.displayName,
    courses: payload.profile.courses,
  };
  const contextString = buildContextString(profile);
  const messageResult = await getMessagesForLocation(String(locationId));
  const semanticByMessageId = await getSemanticSimilarities({
    contextString,
    locationId,
  });
  const messagesWithSimilarity = messageResult.messages.map((message) => ({
    ...message,
    semantic_similarity: semanticByMessageId.similarities.get(message.id) ?? null,
  }));
  const rankedMessages = addSemanticReasonChips(
    rankMessages(messagesWithSimilarity, profile),
    semanticByMessageId.mode,
  );

  return NextResponse.json({
    contextString,
    mode: semanticByMessageId.mode,
    source: messageResult.source,
    warning: semanticByMessageId.warning ?? messageResult.error,
    messages: rankedMessages.map((message, index) =>
      serializeRankedMessage(message, index),
    ),
  });
}

function addSemanticReasonChips(
  messages: Array<RankedMessage<MessageRecord>>,
  rankingMode: "stage-a" | "stage-b",
) {
  if (rankingMode !== "stage-b") {
    return messages.map((message) => ({
      ...message,
      rankingReasons: normalizeReasonChips(message.rankingReasons),
    }));
  }

  return messages.map((message) => ({
    ...message,
    rankingReasons: normalizeReasonChips([
      ...message.rankingReasons,
      getSemanticMatchLabel(message.semantic_similarity),
    ]),
  }));
}

function normalizeReasonChips(chips: Array<string | null>) {
  const uniqueChips = Array.from(
    new Set(chips.filter((chip): chip is string => Boolean(chip))),
  );

  if (uniqueChips.includes("Strong semantic match")) {
    return sortReasonChips(
      uniqueChips.filter((chip) => chip !== "Medium semantic match"),
    );
  }

  return sortReasonChips(uniqueChips);
}

function sortReasonChips(chips: string[]) {
  return [...chips].sort(
    (first, second) => getReasonChipPriority(first) - getReasonChipPriority(second),
  );
}

function getReasonChipPriority(chip: string) {
  if (chip.startsWith("Matched ")) {
    return 1;
  }

  if (chip === "Strong semantic match" || chip === "Medium semantic match") {
    return 2;
  }

  if (
    chip === "Exam advice" ||
    chip === "Study tip" ||
    chip === "Emotional support"
  ) {
    return 3;
  }

  if (chip === "Relevant to week 10") {
    return 4;
  }

  if (chip === "Popular at this desk") {
    return 5;
  }

  return 6;
}

async function getSemanticSimilarities({
  contextString,
  locationId,
}: {
  contextString: string;
  locationId: number;
}): Promise<{
  mode: "stage-a" | "stage-b";
  similarities: Map<string, number>;
  warning?: string;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      mode: "stage-a",
      similarities: new Map(),
      warning: "OPENAI_API_KEY is missing, so deterministic ranking was used.",
    };
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      mode: "stage-a",
      similarities: new Map(),
      warning: "Supabase is not configured, so deterministic ranking was used.",
    };
  }

  try {
    const embedding = await embedText(contextString);
    const { data, error } = await supabase.rpc("match_messages_for_location", {
      query_embedding: toVectorLiteral(embedding),
      target_location_id: locationId,
      match_count: defaultMatchCount,
    });

    if (error) {
      return {
        mode: "stage-a",
        similarities: new Map(),
        warning: getVectorSearchWarning(error.message),
      };
    }

    const similarities = new Map<string, number>();

    for (const message of data ?? []) {
      similarities.set(message.id, message.semantic_similarity);
    }

    return {
      mode: similarities.size > 0 ? "stage-b" : "stage-a",
      similarities,
      warning:
        similarities.size > 0
          ? undefined
          : "No embedded messages found; deterministic ranking was used.",
    };
  } catch (error) {
    return {
      mode: "stage-a",
      similarities: new Map(),
      warning: getEmbeddingFailureWarning(error),
    };
  }
}

function getVectorSearchWarning(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("match_messages_for_location") ||
    normalizedMessage.includes("embedding") ||
    normalizedMessage.includes("vector") ||
    normalizedMessage.includes("function") ||
    normalizedMessage.includes("schema cache")
  ) {
    return "Vector search is not ready; deterministic ranking was used.";
  }

  return `Vector search failed; deterministic ranking was used. ${message}`;
}

function getEmbeddingFailureWarning(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("OPENAI_API_KEY")) {
      return "OPENAI_API_KEY is missing, so deterministic ranking was used.";
    }

    return `Embedding ranking failed; deterministic ranking was used. ${error.message}`;
  }

  return "Embedding ranking failed; deterministic ranking was used.";
}

function serializeRankedMessage(
  message: RankedMessage<MessageRecord>,
  index: number,
) {
  const serializedMessage = {
    id: message.id,
    location_id: message.location_id,
    author_id: message.author_id,
    author_label: message.author_label,
    pseudonym: message.pseudonym,
    body: message.body,
    tags: message.tags,
    course_tags: message.course_tags,
    upvotes: message.upvotes,
    status: message.status,
    term_week_when_written: message.term_week_when_written,
    created_at: message.created_at,
    score: message.rankingScore,
    why: message.rankingReasons,
    rankingScore: message.rankingScore,
    rankingReasons: message.rankingReasons,
    semantic_similarity: message.semantic_similarity ?? null,
  };

  if (process.env.NODE_ENV !== "development") {
    return serializedMessage;
  }

  return {
    ...serializedMessage,
    debugRanking: {
      rank: index + 1,
      finalScore: message.rankingScore,
      scoreParts: message.scoreParts,
    },
  };
}

function isRankedMessagesPayload(
  payload: unknown,
): payload is { locationId: string | number; profile: StudyProfile } {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybePayload = payload as {
    locationId?: unknown;
    profile?: {
      profileId?: unknown;
      displayName?: unknown;
      courses?: unknown;
    };
  };

  return (
    (typeof maybePayload.locationId === "string" ||
      typeof maybePayload.locationId === "number") &&
    Boolean(maybePayload.profile) &&
    typeof maybePayload.profile?.profileId === "string" &&
    typeof maybePayload.profile?.displayName === "string" &&
    Array.isArray(maybePayload.profile?.courses) &&
    maybePayload.profile.courses.length > 0 &&
    maybePayload.profile.courses.every((course) => typeof course === "string")
  );
}
