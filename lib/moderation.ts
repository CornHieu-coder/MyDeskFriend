import { createOpenAIClient } from "@/lib/openai";

type MessageSafetyResult =
  | {
      ok: true;
      tags: string[];
      courseTags: string[];
    }
  | {
      ok: false;
      error: string;
      status: 400 | 503;
    };

const moderationModel = "omni-moderation-latest";

const contactInfoPatterns = [
  {
    label: "URLs are not allowed in demo messages.",
    pattern:
      /\b(?:https?:\/\/|www\.|[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+\.(?:com|net|org|edu|gov|io|co|ai|app|dev|me|info|au)\b)/i,
  },
  {
    label: "Email addresses are not allowed in demo messages.",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    label: "Phone numbers are not allowed in demo messages.",
    pattern: /(?:\+?\d[\s().-]*){8,}\d/,
  },
] as const;

const obviousAbusePatterns = [
  /\b(?:kys|kill\s+yourself|go\s+die)\b/i,
  /\b(?:fuck\s+you|shut\s+up)\b/i,
  /\b(?:you|u)\s+(?:are|r)\s+(?:an?\s+)?(?:idiot|moron|loser|stupid|trash)\b/i,
] as const;

const knownCourses = [
  "COMP1511",
  "COMP2521",
  "COMP1531",
  "MATH1081",
  "FINS1613",
  "ECON1101",
] as const;

const messageTagRules = [
  {
    tag: "exam advice",
    pattern: /\b(exam|final|midterm|quiz|test|past paper|revision|revise)\b/i,
  },
  {
    tag: "study tip",
    pattern:
      /\b(study|tip|focus|timer|practice|question|debug|formula|proof|draw|write|remember)\b/i,
  },
  {
    tag: "emotional support",
    pattern:
      /\b(tired|panic|scared|stress|stressed|cry|cried|water|sleep|allowed|progress|hard week)\b/i,
  },
  {
    tag: "memory",
    pattern: /\b(desk|library|seat|room|here|window|morning|tonight)\b/i,
  },
] as const;

export async function moderateMessageBody(
  body: string,
): Promise<MessageSafetyResult> {
  const regexBlock = getRegexBlockMessage(body);

  if (regexBlock) {
    return {
      ok: false,
      error: regexBlock,
      status: 400,
    };
  }

  const openai = createOpenAIClient();

  if (!openai) {
    return {
      ok: false,
      error:
        "Safety checks are unavailable. Configure OPENAI_API_KEY before posting public messages.",
      status: 503,
    };
  }

  try {
    const moderation = await openai.moderations.create({
      input: body,
      model: moderationModel,
    });
    const result = moderation.results[0];

    if (!result) {
      return {
        ok: false,
        error: "Safety check could not read the moderation result.",
        status: 503,
      };
    }

    if (result.flagged || hasFlaggedModerationCategory(result.categories)) {
      return {
        ok: false,
        error:
          "This note was blocked by the safety check. Please keep messages kind, useful, and study-focused.",
        status: 400,
      };
    }
  } catch (error) {
    console.error("OpenAI moderation failed", error);

    return {
      ok: false,
      error: "Safety check could not be completed. Try again in a moment.",
      status: 503,
    };
  }

  const courseTags = inferCourseTags(body);

  return {
    ok: true,
    tags: inferMessageTags(body, courseTags),
    courseTags,
  };
}

function getRegexBlockMessage(body: string) {
  const contactInfoMatch = contactInfoPatterns.find(({ pattern }) =>
    pattern.test(body),
  );

  if (contactInfoMatch) {
    return contactInfoMatch.label;
  }

  if (obviousAbusePatterns.some((pattern) => pattern.test(body))) {
    return "Abusive messages are not allowed in this demo.";
  }

  return null;
}

function hasFlaggedModerationCategory(categories: object) {
  return Object.values(categories).some((value) => value === true);
}

function inferCourseTags(body: string) {
  return knownCourses.filter((course) =>
    new RegExp(`\\b${course}\\b`, "i").test(body),
  );
}

function inferMessageTags(body: string, courseTags: string[]) {
  const tags = messageTagRules
    .filter(({ pattern }) => pattern.test(body))
    .map(({ tag }) => tag);

  if (courseTags.length > 0) {
    tags.push("course advice");
  }

  if (tags.length === 0) {
    tags.push("memory");
  }

  return [...new Set(tags)].slice(0, 3);
}
