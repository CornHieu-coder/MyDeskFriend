"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getDisplayAuthorLabel } from "@/lib/author-label";
import type { LocationRecord } from "@/lib/locations";
import type { MessageRecord } from "@/lib/messages";
import { MessageComposer } from "./message-composer";

type DeskArchiveClientProps = {
  location: LocationRecord;
  messages: MessageRecord[];
  checkInToken: string | null;
  debugInfo?: {
    locationSource: string;
    messageSource: string;
    messageError?: string;
  };
};

type StudyProfile = {
  profileId: string;
  displayName: string;
  courses: string[];
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
  checkInToken,
  debugInfo,
}: DeskArchiveClientProps) {
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
            </p>
          ) : null}
        </section>

        <ProfileBanner
          onSwitchProfile={() => setIsEditingProfile(true)}
          profile={profile}
        />

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#8a5135]">
                {messages.length} notes from this place
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                What students left here
              </h2>
            </div>

            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
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
              checkInToken={checkInToken}
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
  onSwitchProfile,
  profile,
}: {
  onSwitchProfile: () => void;
  profile: StudyProfile;
}) {
  return (
    <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfd8d4] bg-[#eef7f1] px-5 py-4">
      <p className="font-semibold text-[#23483a]">
        Personalised for {profile.displayName} · {profile.courses.join(" · ")}
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

function MessageCard({ message }: { message: MessageRecord }) {
  const tagList = [...message.tags, ...message.course_tags];
  const authorLabel = getDisplayAuthorLabel(message);

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
      <p className="mt-4 text-sm font-medium text-[#8a5135]">
        {message.upvotes} upvotes
      </p>
    </article>
  );
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
