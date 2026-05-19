import "server-only";
import OpenAI from "openai";

const embeddingModel = "text-embedding-3-small";

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export async function embedText(text: string) {
  const client = createOpenAIClient();

  if (!client) {
    throw new Error("OPENAI_API_KEY is required to create embeddings.");
  }

  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Cannot embed empty text.");
  }

  const response = await client.embeddings
    .create({
      model: embeddingModel,
      input: trimmedText,
    })
    .catch((error: unknown) => {
      throw new Error(getSafeOpenAIErrorMessage(error));
    });
  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error("OpenAI did not return an embedding.");
  }

  return embedding;
}

function getSafeOpenAIErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("429") || message.includes("quota")) {
    return "OpenAI quota or billing is unavailable.";
  }

  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("api key")
  ) {
    return "OPENAI_API_KEY was rejected by OpenAI.";
  }

  if (message.includes("rate limit")) {
    return "OpenAI rate limit was reached.";
  }

  return "OpenAI embedding request failed.";
}
