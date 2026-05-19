export type StudyProfile = {
  profileId: string;
  displayName: string;
  courses: string[];
};

type RankingMessage = {
  id: string;
  body: string;
  tags: string[] | null;
  course_tags: string[] | null;
  upvotes: number | null;
  term_week_when_written: number | null;
  created_at: string;
  semantic_similarity?: number | null;
};

export type RankingScoreParts = {
  courseOverlap: number;
  tagRelevance: number;
  temporalRelevance: number;
  upvoteScore: number;
  agePenalty: number;
  semanticSimilarity: number;
  hasSemanticSimilarity: boolean;
  matchedCourses: string[];
  matchedTag: string | null;
};

export type SemanticMatchThresholds = {
  strong: number;
  medium: number;
};

export type RankedMessage<T extends RankingMessage> = T & {
  rankingScore: number;
  rankingReasons: string[];
  scoreParts: RankingScoreParts;
};

const currentWeek = 10;
const examPeriod = true;
const timeContext = "late night study";
const daysInYear = 365;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function buildContextString(profile: StudyProfile) {
  const profileHint = getProfileHint(profile.profileId);
  const courses = profile.courses.length > 0 ? profile.courses.join(", ") : "general study";

  return [
    courses,
    `UNSW term week ${currentWeek}`,
    examPeriod ? "exam period" : "regular term",
    timeContext,
    profileHint,
  ].join(", ");
}

export function rankMessages<T extends RankingMessage>(
  messages: T[],
  profile: StudyProfile,
  now = new Date(),
): RankedMessage<T>[] {
  return messages
    .map((message) => {
      const scoreParts = scoreMessage(message, profile, now);
      const rankingScore = scoreParts.hasSemanticSimilarity
        ? 0.4 * scoreParts.semanticSimilarity +
          0.35 * scoreParts.courseOverlap +
          0.1 * scoreParts.tagRelevance +
          0.1 * scoreParts.temporalRelevance +
          0.05 * scoreParts.upvoteScore -
          0.03 * scoreParts.agePenalty
        : 0.55 * scoreParts.courseOverlap +
          0.2 * scoreParts.tagRelevance +
          0.15 * scoreParts.temporalRelevance +
          0.1 * scoreParts.upvoteScore -
          0.03 * scoreParts.agePenalty;

      return {
        ...message,
        rankingScore,
        rankingReasons: getWhyThisMessage(message, profile, scoreParts),
        scoreParts,
      };
    })
    .sort((first, second) => {
      if (second.rankingScore !== first.rankingScore) {
        return second.rankingScore - first.rankingScore;
      }

      return second.created_at.localeCompare(first.created_at);
    });
}

export function getWhyThisMessage(
  message: RankingMessage,
  profile: StudyProfile,
  scoreParts: RankingScoreParts,
) {
  const reasons: string[] = [];
  const primaryCourse = scoreParts.matchedCourses[0];
  const semanticMatchLabel = getSemanticMatchLabel(
    scoreParts.hasSemanticSimilarity ? scoreParts.semanticSimilarity : null,
  );

  if (primaryCourse) {
    reasons.push(`Matched ${primaryCourse}`);
  }

  if (semanticMatchLabel) {
    reasons.push(semanticMatchLabel);
  }

  if (scoreParts.matchedTag) {
    reasons.push(capitalizeLabel(scoreParts.matchedTag));
  }

  if (scoreParts.temporalRelevance >= 0.9) {
    reasons.push(`Relevant to week ${currentWeek}`);
  }

  if (scoreParts.upvoteScore >= 0.75) {
    reasons.push("Popular at this desk");
  }

  if (reasons.length === 0 && profile.courses.length > 0) {
    reasons.push(`For ${profile.courses[0]} study context`);
  }

  return reasons.slice(0, 4);
}

export function getSemanticMatchLabel(
  semanticSimilarity?: number | null,
  thresholds: SemanticMatchThresholds = {
    strong: 0.78,
    medium: 0.62,
  },
) {
  if (typeof semanticSimilarity !== "number" || !Number.isFinite(semanticSimilarity)) {
    return null;
  }

  if (semanticSimilarity >= thresholds.strong) {
    return "Strong semantic match";
  }

  if (semanticSimilarity >= thresholds.medium) {
    return "Medium semantic match";
  }

  return null;
}

function scoreMessage(
  message: RankingMessage,
  profile: StudyProfile,
  now: Date,
): RankingScoreParts {
  const profileCourses = profile.courses.map((course) => course.toUpperCase());
  const messageCourses = (message.course_tags ?? []).map((course) =>
    course.toUpperCase(),
  );
  const matchedCourses = messageCourses.filter((course) =>
    profileCourses.includes(course),
  );
  const courseOverlap = matchedCourses.length > 0 ? 1 : 0;
  const tagResult = getTagRelevance(message.tags ?? []);
  const temporalRelevance =
    typeof message.term_week_when_written === "number"
      ? Math.max(
          0,
          1 - Math.abs(currentWeek - message.term_week_when_written) / 10,
        )
      : 0.5;
  const upvotes = Math.max(0, message.upvotes ?? 0);
  const upvoteScore = Math.min(Math.log1p(upvotes) / Math.log1p(20), 1);
  const agePenalty = getAgePenalty(message.created_at, now);
  const semanticSimilarity =
    typeof message.semantic_similarity === "number" &&
    Number.isFinite(message.semantic_similarity)
      ? Math.max(0, Math.min(message.semantic_similarity, 1))
      : 0;

  return {
    courseOverlap,
    tagRelevance: tagResult.score,
    temporalRelevance,
    upvoteScore,
    agePenalty,
    semanticSimilarity,
    hasSemanticSimilarity:
      typeof message.semantic_similarity === "number" &&
      Number.isFinite(message.semantic_similarity),
    matchedCourses,
    matchedTag: tagResult.label,
  };
}

function getTagRelevance(tags: string[]) {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());

  if (examPeriod && normalizedTags.includes("exam advice")) {
    return { score: 1, label: "exam advice" };
  }

  if (normalizedTags.includes("study tip")) {
    return { score: 0.8, label: "study tip" };
  }

  if (normalizedTags.includes("emotional support")) {
    return { score: 0.7, label: "emotional support" };
  }

  return { score: 0, label: null };
}

function getAgePenalty(createdAt: string, now: Date) {
  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) {
    return 0;
  }

  const daysOld = Math.max(0, now.getTime() - createdTime) / millisecondsPerDay;

  return Math.min(daysOld / daysInYear, 1);
}

function getProfileHint(profileId: string) {
  if (profileId === "alex") {
    return "COMP2521 final exam soon, recursion, data structures, MATH1081 graph proofs";
  }

  if (profileId === "jamie") {
    return "FINS1613 quiz soon, finance formulas, risk return, ECON1101 economics concepts";
  }

  return "study tips, exam advice, emotional support";
}

function capitalizeLabel(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
