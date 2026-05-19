"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getDisplayAuthorLabel } from "@/lib/author-label";
import type { LocationRecord } from "@/lib/locations";
import type { MessageRecord } from "@/lib/messages";
import {
  buildContextString,
  rankMessages,
  type StudyProfile,
} from "@/lib/ranking";
import { MessageComposer } from "./message-composer";

// ─── Design tokens ─────────────────────────────────────────────
const INK    = "#1F1B16";
const INK_2  = "#4A4137";
const INK_3  = "#7A6F60";
const PAPER  = "#FBF8F2";
const BG     = "#F4EFE6";
const BG_2   = "#ECE5D8";
const RULE   = "#DDD3C0";
const RULE_S = "#E6DDC9";
const ACCENT = "#F0B49A";

const SERIF = "var(--font-instrument-serif), Georgia, serif";
const SANS  = "var(--font-geist-sans), system-ui, sans-serif";
const MONO  = "var(--font-geist-mono), ui-monospace, monospace";

// ─── Types ─────────────────────────────────────────────────────
type DeskArchiveClientProps = {
  location: LocationRecord;
  messages: MessageRecord[];
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
  { profileId: "alex",  displayName: "Alex",  courses: ["COMP2521", "MATH1081"] },
  { profileId: "jamie", displayName: "Jamie", courses: ["FINS1613", "ECON1101"] },
];

// ─── Small atoms ───────────────────────────────────────────────
function Eyebrow({ children, num }: { children: React.ReactNode; num?: string }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em",
      color: INK_3, textTransform: "uppercase" as const,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {num != null && <span style={{ color: ACCENT }}>{num}</span>}
      {num != null && <span style={{ width: 18, height: 1, background: RULE, display: "inline-block" }} />}
      <span>{children}</span>
    </div>
  );
}

function CraneMini({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
      <g stroke={ACCENT} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M8 32 L32 18 L56 32 L32 40 Z" fill={ACCENT} fillOpacity="0.14" />
        <path d="M32 18 L32 40" />
        <path d="M32 40 L20 52" />
        <path d="M32 40 L44 52" />
        <path d="M32 18 L40 10" />
      </g>
    </svg>
  );
}

function SymbolDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 28px" }}>
      <div style={{ flex: 1, height: 1, background: RULE }} />
      <CraneMini size={20} />
      <div style={{ flex: 1, height: 1, background: RULE }} />
    </div>
  );
}

// ─── Top bar ───────────────────────────────────────────────────
function TopBar() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 22px 14px",
    }}>
      <Link href="/" style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 14px 8px 10px",
        borderRadius: 100,
        background: "transparent",
        border: `1px solid ${RULE}`,
        fontFamily: SANS, fontSize: 13, fontWeight: 500,
        color: INK_2, textDecoration: "none",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Welcome
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: "#7FA98C",
          boxShadow: "0 0 0 4px #7FA98C22", display: "inline-block",
        }} />
        <span style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
          color: INK_3, textTransform: "uppercase" as const,
        }}>
          Scanned · live
        </span>
      </div>
    </div>
  );
}

// ─── Desk hero ─────────────────────────────────────────────────
function DeskHero({ location, messageCount }: { location: LocationRecord; messageCount: number }) {
  const building = location.building ?? "Library";
  const floor    = location.floor    ?? "Level 1";

  return (
    <section style={{ padding: "20px 28px 32px" }}>
      <Eyebrow>{building} · {floor}</Eyebrow>

      <h1 style={{
        fontFamily: SERIF, fontWeight: 400,
        fontSize: "clamp(56px, 18vw, 76px)", lineHeight: 0.95,
        letterSpacing: "-0.022em",
        color: INK, margin: "16px 0 18px",
      }}>
        Desk{" "}
        <em style={{ fontStyle: "italic", color: ACCENT }}>
          {location.id}<span style={{ color: INK, fontStyle: "normal" }}>.</span>
        </em>
      </h1>

      {location.description && (
        <p style={{
          fontFamily: SANS, fontSize: 15, lineHeight: 1.55,
          color: INK_2, margin: "0 0 28px", maxWidth: 340,
        }}>
          {location.description}
        </p>
      )}

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: `1px solid ${RULE}`,
        borderBottom: `1px solid ${RULE}`,
        padding: "16px 0",
      }}>
        {[
          { label: "Building", value: building },
          { label: "Floor",    value: floor },
          { label: "Archive",  value: `${messageCount} notes` },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding: i === 0 ? "0 12px 0 0" : i === 2 ? "0 0 0 12px" : "0 12px",
            borderLeft: i === 0 ? "none" : `1px solid ${RULE_S}`,
          }}>
            <div style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em",
              color: INK_3, textTransform: "uppercase" as const, marginBottom: 6,
            }}>
              {m.label}
            </div>
            <div style={{
              fontFamily: SERIF, fontSize: 18, lineHeight: 1.15,
              color: INK, letterSpacing: "-0.01em",
            }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Personalised strip ────────────────────────────────────────
function PersonalisedStrip({ profile, contextString, onSwitchProfile }: {
  profile: StudyProfile;
  contextString: string;
  onSwitchProfile: () => void;
}) {
  return (
    <section style={{ margin: "0 28px", padding: "20px 0 24px" }} title={contextString || undefined}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <Eyebrow>Personalised for {profile.displayName}</Eyebrow>
        <button
          onClick={onSwitchProfile}
          type="button"
          style={{
            fontFamily: SANS, fontSize: 12, fontWeight: 500,
            color: INK_2, background: "transparent", border: "none",
            padding: 0, cursor: "pointer",
            textDecoration: "underline", textUnderlineOffset: 3,
            textDecorationColor: RULE,
          }}
        >
          Switch profile
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
        {profile.courses.map((course) => (
          <span key={course} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            borderRadius: 100,
            background: PAPER,
            border: `1px solid ${RULE}`,
            fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em",
            color: INK,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, display: "inline-block" }} />
            {course}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Note card ─────────────────────────────────────────────────
function NoteCard({ message, index, profileCourses, rankingMode }: {
  message: DisplayedMessage;
  index: number;
  profileCourses: string[];
  rankingMode: "stage-a" | "stage-b";
}) {
  const authorLabel = getDisplayAuthorLabel(message);
  const unmatchedCourseTags = message.course_tags.filter((c) => !profileCourses.includes(c));
  const tagList = [...message.tags, ...unmatchedCourseTags];
  const whyChips = getVisibleWhyChips(message, index, rankingMode);
  const accentNumber = String(index + 1).padStart(2, "0");

  return (
    <article style={{
      background: PAPER,
      border: `1px solid ${RULE_S}`,
      borderRadius: 16,
      padding: "20px 20px 18px",
      position: "relative",
    }}>
      {/* index */}
      <div style={{
        position: "absolute", top: 18, right: 18,
        fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
        color: INK_3, textTransform: "uppercase" as const,
      }}>
        {accentNumber}
      </div>

      {/* author + date */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: SERIF, fontStyle: "italic",
          fontSize: 19, lineHeight: 1.1, color: INK, letterSpacing: "-0.005em",
        }}>
          {authorLabel}
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em",
          color: INK_3, textTransform: "uppercase" as const, marginTop: 4,
        }}>
          {formatMessageTime(message.created_at)}
        </div>
      </div>

      {/* body */}
      <p style={{
        fontFamily: SANS, fontSize: 15, lineHeight: 1.55,
        color: INK, margin: "0 0 16px",
      }}>
        {message.body}
      </p>

      {/* tags */}
      {tagList.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 10 }}>
          {tagList.map((tag, ti) => (
            <span key={`tag-${ti}-${tag}`} style={{
              display: "inline-flex", alignItems: "center",
              padding: "4px 10px", borderRadius: 100,
              background: "transparent", border: `1px solid ${RULE}`, color: INK_2,
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase" as const, fontWeight: 500,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* why chips */}
      {whyChips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 14 }}>
          {whyChips.map((chip) => (
            <span key={chip} style={{
              display: "inline-flex", alignItems: "center",
              padding: "4px 10px", borderRadius: 100,
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase" as const, fontWeight: 500,
              ...getWhyChipStyle(chip),
            }}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* upvotes */}
      <div style={{
        display: "flex", alignItems: "center",
        paddingTop: 12,
        borderTop: `1px solid ${RULE_S}`,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em",
          color: INK_3, textTransform: "uppercase" as const,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4l8 8h-5v8h-6v-8H4z" />
          </svg>
          {message.upvotes} upvotes
        </span>
      </div>
    </article>
  );
}

// ─── Notes section ─────────────────────────────────────────────
function NotesSection({ messages, profileCourses, rankingMode }: {
  messages: DisplayedMessage[];
  profileCourses: string[];
  rankingMode: "stage-a" | "stage-b";
}) {
  return (
    <section style={{ padding: "44px 28px 56px" }}>
      <Eyebrow num="✱">Read</Eyebrow>

      <h2 style={{
        fontFamily: SERIF, fontWeight: 400,
        fontSize: 36, lineHeight: 1.02, letterSpacing: "-0.018em",
        color: INK, margin: "14px 0 24px",
      }}>
        What students{" "}
        <em style={{ fontStyle: "italic", color: ACCENT }}>left here</em>.
      </h2>

      {messages.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
          {messages.map((message, i) => (
            <NoteCard
              key={message.id}
              message={message}
              index={i}
              profileCourses={profileCourses}
              rankingMode={rankingMode}
            />
          ))}
        </div>
      ) : (
        <div style={{
          padding: "28px 24px",
          background: PAPER,
          border: `1px dashed ${RULE}`,
          borderRadius: 16,
          fontFamily: SANS, fontSize: 15, color: INK_3,
          textAlign: "center" as const,
        }}>
          No notes left here yet. Be the first.
        </div>
      )}
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────
function DeskFooter({ locationId }: { locationId: number }) {
  return (
    <footer style={{
      padding: "28px 28px 44px",
      borderTop: `1px solid ${RULE}`,
      textAlign: "center" as const,
    }}>
      <p style={{
        fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em",
        color: INK_3, textTransform: "uppercase" as const, margin: "0 0 6px",
      }}>
        Echoes · Desk {locationId}
      </p>
      <p style={{
        fontFamily: SERIF, fontStyle: "italic", fontSize: 14,
        color: INK_3, margin: 0,
      }}>
        You belong here too.
      </p>
    </footer>
  );
}

// ─── Onboarding panel ──────────────────────────────────────────
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
  const [displayName, setDisplayName] = useState(currentProfile?.displayName ?? "You");
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
    setSelectedCourses((cur) =>
      !wasManualProfile
        ? [course]
        : cur.includes(course)
        ? cur.filter((c) => c !== course)
        : [...cur, course],
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
    <div style={{ background: BG, minHeight: "100vh", color: INK }}>
      <TopBar />
      <div style={{ padding: "24px 28px 60px" }}>
        <Eyebrow>{locationName}</Eyebrow>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 400,
          fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.018em",
          color: INK, margin: "16px 0 8px",
        }}>
          Tell us what you&apos;re{" "}
          <em style={{ fontStyle: "italic", color: ACCENT }}>studying</em>{" "}
          so the notes here mean something to you.
        </h1>

        <form onSubmit={handleSubmit} style={{ marginTop: 32 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
              color: INK_3, textTransform: "uppercase" as const, marginBottom: 14,
            }}>
              Choose a demo profile
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {personaProfiles.map((persona) => {
                const isSelected = selectedProfileId === persona.profileId;
                return (
                  <button
                    key={persona.profileId}
                    type="button"
                    onClick={() => choosePersona(persona)}
                    style={{
                      padding: "16px 18px", borderRadius: 14,
                      background: isSelected ? PAPER : BG_2,
                      border: `1px solid ${isSelected ? ACCENT : RULE}`,
                      textAlign: "left" as const, cursor: "pointer",
                      transition: "border-color 120ms ease",
                    }}
                  >
                    <div style={{ fontFamily: SERIF, fontSize: 20, color: INK, marginBottom: 10 }}>
                      {persona.displayName}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                      {persona.courses.map((course) => (
                        <span key={course} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 100,
                          background: PAPER, border: `1px solid ${RULE}`,
                          fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: INK,
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT, display: "inline-block" }} />
                          {course}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
              color: INK_3, textTransform: "uppercase" as const, marginBottom: 14,
            }}>
              Or choose your courses
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {courseOptions.map((course) => {
                const isSelected = selectedProfileId === "manual" && selectedCourses.includes(course);
                return (
                  <button
                    key={course}
                    type="button"
                    onClick={() => toggleManualCourse(course)}
                    style={{
                      padding: "8px 16px", borderRadius: 100,
                      background: isSelected ? INK : PAPER,
                      border: `1px solid ${isSelected ? INK : RULE}`,
                      fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em",
                      color: isSelected ? PAPER : INK_2,
                      cursor: "pointer",
                      transition: "background 120ms ease, color 120ms ease",
                    }}
                  >
                    {course}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p style={{
              padding: "12px 16px", marginBottom: 20,
              background: "#FFF0EE", border: "1px solid #EFAFA6",
              borderRadius: 10, fontFamily: SANS, fontSize: 13, color: "#943C30",
            }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <button
              type="submit"
              style={{
                padding: "13px 24px", borderRadius: 100,
                background: INK, color: PAPER, border: "none",
                fontFamily: SANS, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Enter archive
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: "13px 24px", borderRadius: 100,
                  background: "transparent", color: INK_2,
                  border: `1px solid ${RULE}`,
                  fontFamily: SANS, fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                Keep current profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────
export function DeskArchiveClient({ location, messages }: DeskArchiveClientProps) {
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [apiRanking, setApiRanking] = useState<RankedMessagesApiResult | null>(null);

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
  const contextString = apiRanking?.contextString ?? (profile ? buildContextString(profile) : "");
  const rankingMode = apiRanking?.mode ?? "stage-a";

  useEffect(() => {
    if (!profile) return;

    const controller = new AbortController();

    Promise.resolve().then(() => {
      if (!controller.signal.aborted) setApiRanking(null);
    });

    fetch("/api/ranked-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: location.id, profile }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? (res.json() as Promise<unknown>) : null))
      .then((payload) => {
        if (!controller.signal.aborted && isRankedMessagesApiResult(payload)) {
          setApiRanking(payload);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setApiRanking(null);
      });

    return () => controller.abort();
  }, [location.id, messages, profile]);

  if (isCheckingProfile) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em",
          color: INK_3, textTransform: "uppercase" as const,
        }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!profile || isEditingProfile) {
    return (
      <OnboardingPanel
        currentProfile={profile}
        locationName={location.name}
        onCancel={profile ? () => setIsEditingProfile(false) : undefined}
        onSaveProfile={handleSaveProfile}
      />
    );
  }

  return (
    <main style={{ background: BG, minHeight: "100vh", color: INK }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <TopBar />
        <DeskHero location={location} messageCount={messages.length} />
        <PersonalisedStrip
          profile={profile}
          contextString={contextString}
          onSwitchProfile={() => setIsEditingProfile(true)}
        />
        <SymbolDivider />
        <MessageComposer locationId={location.id} locationName={location.name} />
        <NotesSection
          messages={displayedMessages}
          profileCourses={profile.courses}
          rankingMode={rankingMode}
        />
        <DeskFooter locationId={location.id} />
      </div>
    </main>
  );
}

// ─── Why-chip helpers ───────────────────────────────────────────
function getVisibleWhyChips(
  message: DisplayedMessage,
  rankIndex: number,
  rankingMode: "stage-a" | "stage-b",
) {
  const fullChips = normalizeWhyChips(message.rankingReasons);

  if (rankingMode === "stage-a") {
    return rankIndex < 3 ? fullChips.slice(0, 4) : [];
  }

  if (rankIndex < 3)  return fullChips.slice(0, 5);
  if (rankIndex < 10) return fullChips.filter(isLimitedWhyChip).slice(0, 2);

  const matchedChip  = fullChips.find((c) => c.startsWith("Matched "));
  const semanticChip = fullChips.find(
    (c) => c === "Strong semantic match" || c === "Medium semantic match",
  );
  return matchedChip && semanticChip ? [matchedChip, semanticChip] : [];
}

function normalizeWhyChips(reasons: string[]) {
  return dedupeExclusiveSemanticChips(
    reasons.flatMap(splitWhyReason).filter(Boolean),
  );
}

function splitWhyReason(reason: string) {
  const [matchedReason, tagReason] = reason.split(" + ");
  if (tagReason && matchedReason.startsWith("Matched ")) {
    return [matchedReason, capitalizeChipLabel(tagReason)];
  }
  return [reason];
}

function dedupeExclusiveSemanticChips(chips: string[]) {
  const unique = Array.from(new Set(chips));
  if (unique.includes("Strong semantic match")) {
    return sortWhyChips(unique.filter((c) => c !== "Medium semantic match"));
  }
  return sortWhyChips(unique);
}

function sortWhyChips(chips: string[]) {
  return [...chips].sort((a, b) => getWhyChipPriority(a) - getWhyChipPriority(b));
}

function getWhyChipPriority(chip: string) {
  if (chip.startsWith("Matched "))                                              return 1;
  if (chip === "Strong semantic match" || chip === "Medium semantic match")     return 2;
  if (chip === "Exam advice" || chip === "Study tip" || chip === "Emotional support") return 3;
  if (chip === "Relevant to week 10")                                           return 4;
  if (chip === "Popular at this desk")                                          return 5;
  return 6;
}

function isLimitedWhyChip(chip: string) {
  return (
    chip === "Strong semantic match" ||
    chip === "Medium semantic match" ||
    chip.startsWith("Matched ")
  );
}

function getWhyChipStyle(chip: string): React.CSSProperties {
  if (chip.includes("semantic")) {
    return { background: "#EEF7FF", border: "1px solid #B8D4E8", color: "#24506D" };
  }
  if (chip.startsWith("Matched ")) {
    return { background: "#E8EFE7", border: "1px solid #CFDDCB", color: "#3B5B3B" };
  }
  return { background: "#FFF8E8", border: "1px solid #E1CFA7", color: "#8A5135" };
}

function capitalizeChipLabel(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─── Helpers ───────────────────────────────────────────────────
function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseStoredProfile(value: string | null): StudyProfile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StudyProfile>;
    if (
      typeof parsed.profileId !== "string" ||
      typeof parsed.displayName !== "string" ||
      !Array.isArray(parsed.courses) ||
      parsed.courses.length === 0 ||
      !parsed.courses.every((c) => typeof c === "string")
    ) {
      return null;
    }
    return { profileId: parsed.profileId, displayName: parsed.displayName, courses: parsed.courses };
  } catch {
    return null;
  }
}

function isRankedMessagesApiResult(payload: unknown): payload is RankedMessagesApiResult {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Partial<RankedMessagesApiResult>;
  return (
    typeof p.contextString === "string" &&
    (p.mode === "stage-a" || p.mode === "stage-b") &&
    Array.isArray(p.messages) &&
    p.messages.every(isRankedApiMessage)
  );
}

function isRankedApiMessage(message: unknown): message is RankedApiMessage {
  if (!message || typeof message !== "object") return false;
  const m = message as Partial<RankedApiMessage>;
  return (
    typeof m.id === "string" &&
    typeof m.body === "string" &&
    Array.isArray(m.tags) &&
    Array.isArray(m.course_tags) &&
    typeof m.rankingScore === "number" &&
    Array.isArray(m.rankingReasons)
  );
}
