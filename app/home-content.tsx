"use client";

import Link from "next/link";
import { useState } from "react";
import type { LocationLookupResult } from "@/lib/locations";

type HomeContentProps = {
  desk47: LocationLookupResult;
};

export function HomeContent({ desk47 }: HomeContentProps) {
  const [showStatus, setShowStatus] = useState(false);
  const isSupabaseConnected = desk47.source === "supabase";

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8d2c5] pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#5a6f62]">
              DeskSupport
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              {showStatus ? "MyStudyFriend is live" : "Echoes"}
            </h1>
          </div>

          <div
            aria-label="Home page view"
            className="flex rounded-full border border-[#cfd8d4] bg-white p-1 shadow-sm"
            role="group"
          >
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                !showStatus
                  ? "bg-[#d67454] text-white"
                  : "text-[#426052] hover:bg-[#f7f0ec]"
              }`}
              onClick={() => setShowStatus(false)}
              type="button"
            >
              Welcome
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                showStatus
                  ? "bg-[#d67454] text-white"
                  : "text-[#426052] hover:bg-[#f7f0ec]"
              }`}
              onClick={() => setShowStatus(true)}
              type="button"
            >
              Developer Mode
            </button>
          </div>
        </header>

        {showStatus ? (
          <StatusView
            desk47={desk47}
            isSupabaseConnected={isSupabaseConnected}
          />
        ) : (
          <WelcomeView />
        )}
      </div>
    </main>
  );
}

function WelcomeView() {
  return (
    <section className="grid flex-1 items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col justify-center rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold text-[#8a5135]">
          Study notes that stay with the place
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
          Leave a kind note for the next student at this desk.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#55615a]">
          Echoes lets students open a desk archive and read encouragement,
          advice, and memories from people who have sat there before. Students
          are also welcome to add something helpful for whoever arrives next.
        </p>
      </div>

      <aside className="flex flex-col justify-center rounded-lg border border-[#d8d2c5] bg-[#22352d] p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-[#b9d7c6]">
          Welcome archive
        </p>
        <h2 className="mt-3 text-3xl font-semibold">
          A place for notes, memory, and encouragement.
        </h2>
      </aside>
    </section>
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
          <p className="text-sm font-semibold text-[#8a5135]">
            Hour 0-2 checkpoint
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold sm:text-4xl">
            Scan a place, load a real route, and prove the data layer is ready.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#55615a]">
            This skeleton is wired for Next.js App Router, Tailwind, Supabase,
            OpenAI helpers, and QR generation. Desk 47 already renders from
            Supabase when credentials are present, with seeded fallback data
            protecting the demo while infrastructure is being connected.
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
            <dd className="mt-1 font-medium">
              {desk47.location?.building ?? "Not loaded"}
            </dd>
          </div>
          <div>
            <dt className="text-[#b9d7c6]">Floor</dt>
            <dd className="mt-1 font-medium">
              {desk47.location?.floor ?? "Not loaded"}
            </dd>
          </div>
          <div>
            <dt className="text-[#b9d7c6]">Data source</dt>
            <dd className="mt-1 font-medium capitalize">
              {desk47.source.replace("-", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[#b9d7c6]">Route</dt>
            <dd className="mt-1 font-medium">
              {desk47.location ? "Ready" : "Missing"}
            </dd>
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
