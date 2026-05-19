"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getDisplayAuthorLabel } from "@/lib/author-label";
import type { LocationRecord } from "@/lib/locations";
import type { MessageRecord } from "@/lib/messages";
import {
  buildContextString,
  getSemanticMatchLabel,
  rankMessages,
  type SemanticMatchThresholds,
  type StudyProfile,
} from "@/lib/ranking";
import { MessageComposer } from "./message-composer";

type DeskArchiveClientProps = {
  location: LocationRecord;
  messages: MessageRecord[];
  debugInfo?: {
    locationSource: string;
    messageSource: string;
    messageError?: string;
  };
};

type RankedApiMessage = MessageRecord & {
  rankingScore: number;
  rankingReasons: string[];
  semantic_similarity?: number | null;
};

type DisplayedMessage = MessageRecord & {
  rankingReasons: string[];
  semantic_similarity?: number | null;
};

type RankedMessagesApiResult = {
  contextString: string;
  mode: "stage-a" | "stage-b";
  messages: RankedApiMessage[];
  warning?: string;
};

const profileStorageKey = "mystudyfriend_profile";

const courseOptions = [
  "COMP1511",
  "COMP2521",
  "COMP1531",
  "MATH1081",
  "FINS1613",
  "ECON1101",
] as const;

const personaProfiles: StudyProfile[] = [
  {
    profileId: "alex",
    displayName: "Alex",
    courses: ["COMP2521", "MATH1081"],
  },
  {
    profileId: "jamie",
    displayName: "Jamie",
    courses: ["FINS1613", "ECON1101"],
  },
];

export function DeskArchiveClient({
  location,
  messages,
  debugInfo,
}: DeskArchiveClientProps) {
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [apiRanking, setApiRanking] =
    useState<RankedMessagesApiResult | null>(null);

  useEffect(() => {
    const profileCheck = window.setTimeout(() => {
      const storedProfile = window.localStorage.getItem(profileStorageKey);
      const parsedProfile = parseStoredProfile(storedProfile);

      if (parsedProfile) {
        setProfile(parsedProfile);
      } else {
        window.localStorage.removeItem(profileStorageKey);
      }

      setIsCheckingProfile(false);
    }, 0);

    return () => window.clearTimeout(profileCheck);
  }, []);

  function handleSaveProfile(nextProfile: StudyProfile) {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setIsEditingProfile(false);
  }

  const rankedMessages = useMemo(
    () => (profile ? rankMessages(messages, profile) : []),
    [messages, profile],
  );
  const displayedMessages = apiRanking?.messages ?? rankedMessages;
  const contextString =
    apiRanking?.contextString ?? (profile ? buildContextString(profile) : "");
  const rankingMode = apiRanking?.mode ?? "stage-a";
  const semanticMatchThresholds = useMemo(
    () => getRelativeSemanticMatchThresholds(displayedMessages, rankingMode),
    [displayedMessages, rankingMode],
  );

  useEffect(() => {
    if (!profile) {
      return;
    }

    const controller = new AbortController();

    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setApiRanking(null);
      }
    });

    fetch("/api/ranked-messages", {
      body: JSON.stringify({
        locationId: location.id,
        profile,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          return null;
        }

        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (!controller.signal.aborted && isRankedMessagesApiResult(payload)) {
          setApiRanking(payload);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setApiRanking(null);
        }
      });

    return () => controller.abort();
  }, [location.id, messages, profile]);

  if (isCheckingProfile) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
          <div className="rounded-lg border border-[#d8d2c5] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5a6f62]">
              {location.name}
            </p>
            <p className="mt-3 text-lg font-semibold">
              Checking your study profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile || isEditingProfile) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
          <OnboardingPanel
            currentProfile={profile}
            locationName={location.name}
            onCancel={
              profile ? () => setIsEditingProfile(false) : undefined
            }
            onSaveProfile={handleSaveProfile}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <BackToWelcomeLink />

        <section className="rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5a6f62]">
              {location.building}
            </p>
            <h1 className="mt-3 text-4xl font-semibold">{location.name}</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#55615a]">
              {location.description}
            </p>
          </div>

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoCell label="Building" value={location.building} />
            <InfoCell label="Floor" value={location.floor ?? "Unset"} />
            <InfoCell label="Archive" value={`${messages.length} notes`} />
          </dl>

          {debugInfo ? (
            <p className="mt-5 rounded-md border border-[#ecd0a4] bg-[#fff6e7] px-4 py-3 text-sm font-medium text-[#8a5135]">
              Development only: location source {debugInfo.locationSource};
              message source {debugInfo.messageSource}
              {debugInfo.messageError
                ? `; message error ${debugInfo.messageError}`
                : ""}
              {contextString ? `; ranking context ${contextString}` : ""}
              {apiRanking?.warning ? `; ranking warning ${apiRanking.warning}` : ""}
            </p>
          ) : null}
        </section>

        <ProfileBanner
          contextString={contextString}
          onSwitchProfile={() => setIsEditingProfile(true)}
          profile={profile}
          rankingMode={rankingMode}
        />

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#8a5135]">
                {displayedMessages.length} notes from this place
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                What students left here
              </h2>
              {rankingMode === "stage-b" ? (
                <p className="mt-2 text-sm font-medium text-[#55615a]">
                  Ranked by course fit, semantic similarity, timing, and desk
                  activity.
                </p>
              ) : null}
            </div>

            {displayedMessages.length > 0 ? (
              <div className="space-y-4">
                {displayedMessages.map((message, index) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    rankIndex={index}
                    rankingMode={rankingMode}
                    semanticMatchThresholds={semanticMatchThresholds}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#c6bda9] bg-white p-6 text-[#55615a]">
                No public notes are stored for this desk yet.
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <MessageComposer
              locationId={location.id}
              locationName={location.name}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}

function BackToWelcomeLink() {
  return (
    <nav className="mb-6">
      <Link
        aria-label="Go to welcome page"
        className="inline-flex items-center rounded-full border border-[#cfd8d4] bg-white px-4 py-2 text-sm font-semibold text-[#426052] shadow-sm transition hover:bg-[#eef7f1] focus:outline-none focus:ring-2 focus:ring-[#b8d7c5]"
        href="/"
      >
        Back to welcome
      </Link>
    </nav>
  );
}

function OnboardingPanel({
  currentProfile,
  locationName,
  onCancel,
  onSaveProfile,
}: {
  currentProfile: StudyProfile | null;
  locationName: string;
  onCancel?: () => void;
  onSaveProfile: (profile: StudyProfile) => void;
}) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    currentProfile?.profileId ?? null,
  );
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    currentProfile?.courses ?? [],
  );
  const [displayName, setDisplayName] = useState(
    currentProfile?.displayName ?? "You",
  );
  const [error, setError] = useState<string | null>(null);

  function choosePersona(persona: StudyProfile) {
    setSelectedProfileId(persona.profileId);
    setDisplayName(persona.displayName);
    setSelectedCourses(persona.courses);
    setError(null);
  }

  function toggleManualCourse(course: string) {
    const wasManualProfile = selectedProfileId === "manual";

    setSelectedProfileId("manual");
    setDisplayName("You");
    setError(null);
    setSelectedCourses((currentCourses) =>
      !wasManualProfile
        ? [course]
        : currentCourses.includes(course)
        ? currentCourses.filter((currentCourse) => currentCourse !== course)
        : [...currentCourses, course],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedCourses.length === 0) {
      setError("Choose at least one course before entering the archive.");
      return;
    }

    onSaveProfile({
      profileId: selectedProfileId ?? "manual",
      displayName,
      courses: selectedCourses,
    });
  }

  return (
    <section className="w-full rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5a6f62]">
        {locationName}
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
        Welcome to {locationName}. Tell us what you&apos;re studying so the
        messages here mean something to you.
      </h1>

      <form className="mt-8 space-y-7" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-[#23483a]">
            Choose a demo profile
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {personaProfiles.map((persona) => (
              <button
                className={`rounded-lg border p-5 text-left transition ${
                  selectedProfileId === persona.profileId
                    ? "border-[#1f7a5a] bg-[#eef7f1] shadow-sm"
                    : "border-[#d8d2c5] bg-[#fbfaf7] hover:border-[#8ebba1]"
                }`}
                key={persona.profileId}
                onClick={() => choosePersona(persona)}
                type="button"
              >
                <span className="text-xl font-semibold">
                  {persona.displayName}
                </span>
                <span className="mt-3 flex flex-wrap gap-2">
                  {persona.courses.map((course) => (
                    <span
                      className="rounded-full border border-[#cfd8d4] bg-white px-3 py-1 text-xs font-semibold text-[#426052]"
                      key={course}
                    >
                      {course}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#23483a]">
            Or choose your courses
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {courseOptions.map((course) => {
              const isSelected =
                selectedProfileId === "manual" &&
                selectedCourses.includes(course);

              return (
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "border-[#1f7a5a] bg-[#1f4d3a] text-white"
                      : "border-[#cfd8d4] bg-[#fbfdfc] text-[#426052] hover:border-[#8ebba1]"
                  }`}
                  key={course}
                  onClick={() => toggleManualCourse(course)}
                  type="button"
                >
                  {course}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-[#efb3aa] bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#943c30]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[#1f4d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a2c]"
            type="submit"
          >
            Enter archive
          </button>
          {onCancel ? (
            <button
              className="rounded-full border border-[#cfd8d4] bg-white px-5 py-3 text-sm font-semibold text-[#23483a] transition hover:border-[#8ebba1]"
              onClick={onCancel}
              type="button"
            >
              Keep current profile
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function ProfileBanner({
  contextString,
  onSwitchProfile,
  profile,
  rankingMode,
}: {
  contextString: string;
  onSwitchProfile: () => void;
  profile: StudyProfile;
  rankingMode: "stage-a" | "stage-b";
}) {
  return (
    <section
      className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfd8d4] bg-[#eef7f1] px-5 py-4"
      title={`${contextString} (${rankingMode})`}
    >
      <p className="font-semibold text-[#23483a]">
        Personalised for {profile.displayName}
        {" \u00b7 "}
        {profile.courses.join(" \u00b7 ")}
      </p>
      <button
        className="rounded-full border border-[#9ab7a5] bg-white px-4 py-2 text-sm font-semibold text-[#23483a] transition hover:border-[#1f7a5a]"
        onClick={onSwitchProfile}
        type="button"
      >
        Switch profile
      </button>
    </section>
  );
}

function MessageCard({
  message,
  rankIndex,
  rankingMode,
  semanticMatchThresholds,
}: {
  message: DisplayedMessage;
  rankIndex: number;
  rankingMode: "stage-a" | "stage-b";
  semanticMatchThresholds: SemanticMatchThresholds | null;
}) {
  const tagList = [...message.tags, ...message.course_tags];
  const authorLabel = getDisplayAuthorLabel(message);
  const whyChips = getVisibleWhyChips(
    message,
    rankIndex,
    rankingMode,
    semanticMatchThresholds,
  );

  return (
    <article className="rounded-lg border border-[#d8d2c5] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-[#23483a]">{authorLabel}</p>
        <time className="text-sm text-[#63706a]" dateTime={message.created_at}>
          {formatMessageTime(message.created_at)}
        </time>
      </div>
      <p className="mt-4 text-base leading-7 text-[#1d2520]">{message.body}</p>
      {tagList.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tagList.map((tag) => (
            <span
              className="rounded-full border border-[#cfd8d4] bg-[#f8fbf9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#426052]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {whyChips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {whyChips.map((chip) => (
            <span
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${getWhyChipClassName(
                chip,
              )}`}
              key={chip}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-sm font-medium text-[#8a5135]">
        {message.upvotes} upvotes
      </p>
    </article>
  );
}

function getVisibleWhyChips(
  message: DisplayedMessage,
  rankIndex: number,
  rankingMode: "stage-a" | "stage-b",
  semanticMatchThresholds: SemanticMatchThresholds | null,
) {
  const baseChips = normalizeWhyChips(message.rankingReasons);
  const semanticChip =
    rankingMode === "stage-b" && semanticMatchThresholds
      ? getSemanticMatchLabel(message.semantic_similarity, semanticMatchThresholds)
      : null;
  const fullChips = mergeWhyChips(baseChips, semanticChip);

  if (rankingMode === "stage-a") {
    return rankIndex < 3 ? fullChips.slice(0, 4) : [];
  }

  if (rankIndex < 3) {
    return fullChips.slice(0, 4);
  }

  if (rankIndex < 8) {
    return fullChips
      .filter(isLimitedWhyChip)
      .slice(0, 2);
  }

  const matchedCourseChip = fullChips.find((chip) =>
    chip.startsWith("Matched "),
  );
  const strongSemanticChip = fullChips.find(
    (chip) => chip === "Strong semantic match",
  );

  return matchedCourseChip && strongSemanticChip
    ? [matchedCourseChip, strongSemanticChip]
    : [];
}

function getRelativeSemanticMatchThresholds(
  messages: DisplayedMessage[],
  rankingMode: "stage-a" | "stage-b",
): SemanticMatchThresholds | null {
  if (rankingMode !== "stage-b") {
    return null;
  }

  const similarities = messages
    .map((message) => message.semantic_similarity)
    .filter(
      (similarity): similarity is number =>
        typeof similarity === "number" && Number.isFinite(similarity),
    )
    .sort((first, second) => second - first);

  if (similarities.length === 0) {
    return null;
  }

  // Embedding scores are model- and dataset-dependent, and often cluster in a
  // narrow range. Relative thresholds make the chip labels useful for each
  // ranked response without changing the actual ranking formula.
  return {
    strong: similarities[Math.max(0, Math.ceil(similarities.length * 0.2) - 1)],
    medium: similarities[Math.max(0, Math.ceil(similarities.length * 0.5) - 1)],
  };
}

function normalizeWhyChips(reasons: string[]) {
  return reasons.flatMap((reason) => splitWhyReason(reason)).filter(Boolean);
}

function splitWhyReason(reason: string) {
  const [matchedReason, tagReason] = reason.split(" + ");

  if (tagReason && matchedReason.startsWith("Matched ")) {
    return [matchedReason, capitalizeChipLabel(tagReason)];
  }

  return [reason];
}

function mergeWhyChips(chips: string[], semanticChip: string | null) {
  const mergedChips: string[] = [];

  for (const chip of chips) {
    if (!mergedChips.includes(chip)) {
      mergedChips.push(chip);
    }
  }

  if (semanticChip && !mergedChips.includes(semanticChip)) {
    const firstNonCourseIndex = mergedChips.findIndex(
      (chip) => !chip.startsWith("Matched "),
    );

    if (firstNonCourseIndex === -1) {
      mergedChips.push(semanticChip);
    } else {
      mergedChips.splice(firstNonCourseIndex, 0, semanticChip);
    }
  }

  return mergedChips;
}

function isLimitedWhyChip(chip: string) {
  return (
    chip === "Strong semantic match" ||
    chip === "Medium semantic match" ||
    chip.startsWith("Matched ")
  );
}

function getWhyChipClassName(chip: string) {
  if (chip.includes("semantic")) {
    return "border-[#b8d4e8] bg-[#eef7ff] text-[#24506d]";
  }

  if (chip.startsWith("Matched ")) {
    return "border-[#bfd8ca] bg-[#eef7f1] text-[#23483a]";
  }

  return "border-[#e1cfa7] bg-[#fff8e8] text-[#8a5135]";
}

function capitalizeChipLabel(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e2dccf] bg-[#fbfaf7] p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f786f]">
        {label}
      </dt>
      <dd className="mt-2 text-base font-semibold">{value}</dd>
    </div>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseStoredProfile(value: string | null): StudyProfile | null {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(value) as Partial<StudyProfile>;

    if (
      typeof parsedValue.profileId !== "string" ||
      typeof parsedValue.displayName !== "string" ||
      !Array.isArray(parsedValue.courses) ||
      parsedValue.courses.length === 0 ||
      !parsedValue.courses.every((course) => typeof course === "string")
    ) {
      return null;
    }

    return {
      profileId: parsedValue.profileId,
      displayName: parsedValue.displayName,
      courses: parsedValue.courses,
    };
  } catch {
    return null;
  }
}

function isRankedMessagesApiResult(
  payload: unknown,
): payload is RankedMessagesApiResult {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybePayload = payload as Partial<RankedMessagesApiResult>;

  return (
    typeof maybePayload.contextString === "string" &&
    (maybePayload.mode === "stage-a" || maybePayload.mode === "stage-b") &&
    Array.isArray(maybePayload.messages) &&
    maybePayload.messages.every(isRankedApiMessage)
  );
}

function isRankedApiMessage(message: unknown): message is RankedApiMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const maybeMessage = message as Partial<RankedApiMessage>;

  return (
    typeof maybeMessage.id === "string" &&
    typeof maybeMessage.body === "string" &&
    Array.isArray(maybeMessage.tags) &&
    Array.isArray(maybeMessage.course_tags) &&
    typeof maybeMessage.rankingScore === "number" &&
    Array.isArray(maybeMessage.rankingReasons)
  );
}
