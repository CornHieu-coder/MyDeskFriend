"use client";

import Link from "next/link";
import { useState } from "react";
import type { LocationLookupResult } from "@/lib/locations";

type HomeContentProps = {
  desk47: LocationLookupResult;
};

const ACCENT = "#F0B49A";
const INK = "#1F1B16";
const PAPER = "#FBF8F2";
const BG = "#F4EFE6";
const BG_2 = "#ECE5D8";
const RULE = "#DDD3C0";
const INK_2 = "#4A4137";
const INK_3 = "#7A6F60";

const SERIF = "var(--font-instrument-serif), Georgia, serif";
const SANS = "var(--font-geist-sans), -apple-system, system-ui, sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function Mark({ size = 18, color = PAPER }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="6.8" opacity="0.55" />
      <circle cx="12" cy="12" r="10.2" opacity="0.28" />
    </svg>
  );
}

function Crane({ size = 26, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
      <g stroke={color} strokeWidth="1.1" strokeLinejoin="round">
        <path d="M8 32 L32 18 L56 32 L32 40 Z" fill={color} fillOpacity="0.12" />
        <path d="M32 18 L32 40" />
        <path d="M32 40 L20 52" />
        <path d="M32 40 L44 52" />
        <path d="M32 18 L40 10" />
        <path d="M8 32 L18 30" />
        <path d="M56 32 L46 30" />
      </g>
    </svg>
  );
}

function DividerWithSymbol({ margin = "48px 0" }: { margin?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        margin,
      }}
    >
      <div style={{ flex: 1, height: 1, background: RULE }} />
      <Crane size={26} color={ACCENT} />
      <div style={{ flex: 1, height: 1, background: RULE }} />
    </div>
  );
}

function ModeToggle({
  showStatus,
  onToggle,
  dark = true,
}: {
  showStatus: boolean;
  onToggle: (v: boolean) => void;
  dark?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Home page view"
      style={{
        display: "flex",
        borderRadius: 100,
        border: dark
          ? "1px solid rgba(255,255,255,0.22)"
          : "1px solid #cfd8d4",
        background: dark ? "rgba(255,255,255,0.08)" : "white",
        backdropFilter: dark ? "blur(10px)" : undefined,
        padding: 4,
        boxShadow: dark ? undefined : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(false)}
        style={{
          borderRadius: 100,
          padding: "7px 15px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: SANS,
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          background: !showStatus
            ? dark
              ? ACCENT
              : "#d67454"
            : "transparent",
          color: !showStatus
            ? dark
              ? INK
              : "white"
            : dark
              ? "rgba(255,255,255,0.8)"
              : "#426052",
        }}
      >
        Welcome
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        style={{
          borderRadius: 100,
          padding: "7px 15px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: SANS,
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          background: showStatus
            ? dark
              ? ACCENT
              : "#d67454"
            : "transparent",
          color: showStatus
            ? dark
              ? INK
              : "white"
            : dark
              ? "rgba(255,255,255,0.8)"
              : "#426052",
        }}
      >
        Developer Mode
      </button>
    </div>
  );
}

export function HomeContent({ desk47 }: HomeContentProps) {
  const [showStatus, setShowStatus] = useState(false);
  const isSupabaseConnected = desk47.source === "supabase";

  if (showStatus) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8d2c5] pb-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#5a6f62]">
                DeskSupport
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
                MyStudyFriend is live
              </h1>
            </div>
            <ModeToggle showStatus={showStatus} onToggle={setShowStatus} dark={false} />
          </header>
          <StatusView desk47={desk47} isSupabaseConnected={isSupabaseConnected} />
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: BG, minHeight: "100vh" }}>
      {/* HERO — full viewport height */}
      <section
        style={{
          position: "relative",
          height: "100svh",
          minHeight: 600,
          overflow: "hidden",
          background: INK,
        }}
      >
        <img
          src="/hero-desk.jpg"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "contrast(1.04) saturate(0.92)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(31,27,22,0.55) 0%, rgba(31,27,22,0.28) 38%, rgba(31,27,22,0.7) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 70% at 50% 45%, transparent 0%, rgba(31,27,22,0.4) 100%)",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mark size={18} color={PAPER} />
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 20,
                fontStyle: "italic",
                color: PAPER,
                letterSpacing: "-0.01em",
                opacity: 0.92,
              }}
            >
              Echoes
            </span>
          </div>
          <ModeToggle showStatus={showStatus} onToggle={setShowStatus} dark={true} />
        </div>

        {/* Centered hero content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "0 28px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.18)",
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.95)",
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                display: "block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: ACCENT,
                animation: "pulseDot 2.6s ease-in-out infinite",
              }}
            />
            A campus story archive
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "clamp(52px, 10vw, 80px)",
              lineHeight: 0.96,
              letterSpacing: "-0.022em",
              color: PAPER,
              margin: "0 0 28px",
              textShadow: "0 2px 30px rgba(0,0,0,0.45)",
            }}
          >
            Every desk
            <br />
            holds a{" "}
            <em style={{ color: ACCENT, fontStyle: "italic" }}>
              story<span style={{ color: PAPER, fontStyle: "normal" }}>.</span>
            </em>
          </h1>

          <p
            style={{
              fontFamily: SANS,
              fontSize: 15.5,
              lineHeight: 1.55,
              color: "rgba(251,248,242,0.88)",
              margin: 0,
              maxWidth: 360,
            }}
          >
            Preserving student advice, encouragement, and shared experiences across campus spaces.
          </p>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: "rgba(251,248,242,0.65)",
            fontFamily: MONO,
            fontSize: 9.5,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          <span>Scroll</span>
          <div
            style={{
              width: 1,
              height: 24,
              background: "linear-gradient(180deg, rgba(251,248,242,0.7), transparent)",
              animation: "scrollPulse 2.2s ease-in-out infinite",
            }}
          />
        </div>
      </section>

      {/* OUR AIM */}
      <section style={{ padding: "48px 28px 36px", maxWidth: 760, margin: "0 auto" }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            color: INK_3,
            textTransform: "uppercase",
          }}
        >
          Our aim
        </span>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(22px, 4vw, 30px)",
            lineHeight: 1.22,
            color: INK,
            margin: "12px 0 14px",
            letterSpacing: "-0.005em",
          }}
        >
          We bring students together so studying never has to feel{" "}
          <em style={{ color: ACCENT, fontStyle: "italic" }}>lonely</em>.
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: INK_2,
            margin: 0,
          }}
        >
          Find a study buddy, share a session, and make the long nights feel a little less long.
          Whether you&apos;re three weeks ahead or three weeks behind, someone here has been exactly
          where you are.
        </p>
      </section>

      <div style={{ height: 1, background: RULE, margin: "0 28px" }} />

      {/* WHAT YOU'LL FIND HERE */}
      <section style={{ padding: "48px 28px 64px", background: BG_2 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: INK_3,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              What you&apos;ll find here
            </span>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: "clamp(26px, 5vw, 36px)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                color: INK,
                margin: 0,
              }}
            >
              Two simple things, done{" "}
              <em style={{ fontStyle: "italic", color: ACCENT }}>kindly</em>.
            </h2>
          </div>

          <DividerWithSymbol margin="0 0 40px" />

          {/* 01 Read */}
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: INK_3,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <span style={{ color: ACCENT }}>01</span>
              <span style={{ display: "block", width: 18, height: 1, background: RULE }} />
              Read
            </div>
            <h3
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: "clamp(24px, 5vw, 34px)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                color: INK,
                margin: "0 0 14px",
              }}
            >
              Notes from students{" "}
              <em style={{ color: ACCENT, fontStyle: "italic" }}>who sat here first</em>.
            </h3>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14.5,
                lineHeight: 1.6,
                color: INK_2,
                margin: 0,
              }}
            >
              Quiet encouragement, hard-won shortcuts, and real advice from students who&apos;ve
              taken the exact course you&apos;re taking now. Read a few before your next study
              session — someone has already been where you are.
            </p>
          </div>

          <DividerWithSymbol margin="48px 0" />

          {/* 02 Write */}
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: INK_3,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <span style={{ color: ACCENT }}>02</span>
              <span style={{ display: "block", width: 18, height: 1, background: RULE }} />
              Write
            </div>
            <h3
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: "clamp(24px, 5vw, 34px)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                color: INK,
                margin: "0 0 14px",
              }}
            >
              <em style={{ color: ACCENT, fontStyle: "italic" }}>Pass it forward</em>{" "}when you&apos;re ready.
            </h3>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14.5,
                lineHeight: 1.6,
                color: INK_2,
                margin: 0,
              }}
            >
              Write the note you wish someone had left for you. One sentence is enough. The smaller,
              the truer — anonymous by default, you decide who gets credit.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusView({
  desk47,
  isSupabaseConnected,
}: {
  desk47: LocationLookupResult;
  isSupabaseConnected: boolean;
}) {
  return (
    <section className="grid flex-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col justify-between rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-[#8a5135]">Hour 0-2 checkpoint</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold sm:text-4xl">
            Scan a place, load a real route, and prove the data layer is ready.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#55615a]">
            This skeleton is wired for Next.js App Router, Tailwind, Supabase, OpenAI helpers, and
            QR generation. Desk 47 already renders from Supabase when credentials are present, with
            seeded fallback data protecting the demo while infrastructure is being connected.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatusTile label="Next.js" value="App Router" tone="green" />
          <StatusTile
            label="Supabase"
            value={isSupabaseConnected ? "Connected" : "Fallback"}
            tone={isSupabaseConnected ? "green" : "amber"}
          />
          <StatusTile
            label="Desk 47"
            value={desk47.location ? "Found" : "Missing"}
            tone={desk47.location ? "green" : "red"}
          />
          <StatusTile
            label="Route"
            value={desk47.location ? "Ready" : "Missing"}
            tone={desk47.location ? "green" : "red"}
          />
        </div>
      </div>

      <aside className="rounded-lg border border-[#d8d2c5] bg-[#22352d] p-6 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#b9d7c6]">Desk 47</p>
        <h2 className="mt-3 text-2xl font-semibold">
          {desk47.location?.name ?? "Location unavailable"}
        </h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-[#b9d7c6]">Building</dt>
            <dd className="mt-1 font-medium">{desk47.location?.building ?? "Not loaded"}</dd>
          </div>
          <div>
            <dt className="text-[#b9d7c6]">Floor</dt>
            <dd className="mt-1 font-medium">{desk47.location?.floor ?? "Not loaded"}</dd>
          </div>
          <div>
            <dt className="text-[#b9d7c6]">Data source</dt>
            <dd className="mt-1 font-medium capitalize">{desk47.source.replace("-", " ")}</dd>
          </div>
          <div>
            <dt className="text-[#b9d7c6]">Route</dt>
            <dd className="mt-1 font-medium">{desk47.location ? "Ready" : "Missing"}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#22352d] transition hover:bg-[#eef5f0]"
            href="/desk/47"
          >
            Open Desk 47
          </Link>
          <Link
            className="rounded-full border border-[#b9d7c6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d4238]"
            href="/api/health"
          >
            View health JSON
          </Link>
        </div>
      </aside>
    </section>
  );
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-[#b8d7c5] bg-[#eef7f1] text-[#1f4d3a]"
      : tone === "amber"
        ? "border-[#ecd0a4] bg-[#fff6e7] text-[#8a5135]"
        : "border-[#efb3aa] bg-[#fff0ee] text-[#943c30]";

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
