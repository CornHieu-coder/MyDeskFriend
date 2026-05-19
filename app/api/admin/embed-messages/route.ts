import { NextResponse } from "next/server";
import { embedText } from "@/lib/openai";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";
import { toVectorLiteral } from "@/lib/vector";

const defaultBatchSize = 10;
const maxBatchSize = 20;

export async function GET(request: Request) {
  const guard = authorizeAdminRequest(request);

  if (guard) {
    return guard;
  }

  const supabase = createServerSupabaseAdminClient();

  if (!supabase) {
    return missingAdminClientResponse();
  }

  const counts = await getEmbeddingCounts(supabase);

  if ("error" in counts) {
    return NextResponse.json({ error: counts.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    totalPublicMessages: counts.totalPublicMessages,
    missingEmbeddings: counts.missingEmbeddings,
    embeddedMessages: counts.embeddedMessages,
    env: getStageBEnvPresence(),
  });
}

export async function POST(request: Request) {
  const guard = authorizeAdminRequest(request);

  if (guard) {
    return guard;
  }

  const supabase = createServerSupabaseAdminClient();

  if (!supabase) {
    return missingAdminClientResponse();
  }

  const batchSize = await getBatchSize(request);
  const { data: messages, error: fetchError } = await supabase
    .from("messages")
    .select("id, body")
    .eq("status", "public")
    .is("embedding", null)
    .order("created_at", { ascending: false })
    .limit(batchSize);

  if (fetchError) {
    return NextResponse.json(
      { error: getEmbeddingSchemaWarning(fetchError.message) },
      { status: 500 },
    );
  }

  const embedded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const message of messages ?? []) {
    try {
      const embedding = await embedText(message.body);
      const { error: updateError } = await supabase
        .from("messages")
        .update({ embedding: toVectorLiteral(embedding) })
        .eq("id", message.id);

      if (updateError) {
        failed.push({
          id: message.id,
          error: getEmbeddingSchemaWarning(updateError.message),
        });
      } else {
        embedded.push(message.id);
      }
    } catch (error) {
      failed.push({
        id: message.id,
        error:
          error instanceof Error
            ? error.message
            : "Unknown embedding failure.",
      });
    }
  }

  const counts = await getEmbeddingCounts(supabase);

  return NextResponse.json({
    ok: failed.length === 0,
    requested: batchSize,
    embeddedCount: embedded.length,
    embedded,
    failed,
    totalPublicMessages: "error" in counts ? null : counts.totalPublicMessages,
    missingEmbeddings: "error" in counts ? null : counts.missingEmbeddings,
    embeddedMessages: "error" in counts ? null : counts.embeddedMessages,
    countError: "error" in counts ? counts.error : undefined,
    env: getStageBEnvPresence(),
  });
}

async function getEmbeddingCounts(
  supabase: NonNullable<ReturnType<typeof createServerSupabaseAdminClient>>,
) {
  const { count: totalCount, error: totalError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "public");

  if (totalError) {
    return { error: totalError.message };
  }

  const { count: missingCount, error: missingError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "public")
    .is("embedding", null);

  if (missingError) {
    return { error: getEmbeddingSchemaWarning(missingError.message) };
  }

  const { count: embeddedCount, error: embeddedError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "public")
    .not("embedding", "is", null);

  if (embeddedError) {
    return { error: getEmbeddingSchemaWarning(embeddedError.message) };
  }

  return {
    totalPublicMessages: totalCount ?? 0,
    missingEmbeddings: missingCount ?? 0,
    embeddedMessages: embeddedCount ?? 0,
  };
}

function authorizeAdminRequest(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminSecret) {
    const providedSecret = request.headers.get("x-admin-secret");

    if (providedSecret !== adminSecret) {
      return NextResponse.json(
        { error: "x-admin-secret header is missing or invalid." },
        { status: 401 },
      );
    }

    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_SECRET is required for this route in production." },
      { status: 401 },
    );
  }

  return null;
}

async function getBatchSize(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    batchSize?: unknown;
    limit?: unknown;
  } | null;
  const requestedLimit = Number(payload?.batchSize ?? payload?.limit);

  if (!Number.isFinite(requestedLimit) || requestedLimit < 1) {
    return defaultBatchSize;
  }

  return Math.min(Math.floor(requestedLimit), maxBatchSize);
}

function missingAdminClientResponse() {
  return NextResponse.json(
    {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required to update message embeddings.",
      env: getStageBEnvPresence(),
    },
    { status: 503 },
  );
}

function getStageBEnvPresence() {
  return {
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
  };
}

function getEmbeddingSchemaWarning(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("embedding") ||
    normalizedMessage.includes("column") ||
    normalizedMessage.includes("schema cache")
  ) {
    return "Embedding column is not ready. Run supabase/schema.sql in Supabase SQL Editor.";
  }

  return message;
}
