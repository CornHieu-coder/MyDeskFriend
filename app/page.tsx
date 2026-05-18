import Link from "next/link";
import { getLocationById } from "@/lib/locations";

export default async function Home() {
  const desk47 = await getLocationById("47");
  const isSupabaseConnected = desk47.source === "supabase";

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8d2c5] pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#5a6f62]">
              DeskSupport
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              MyStudyFriend is live
            </h1>
          </div>
          <Link
            className="rounded-full bg-[#1f4d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a2c]"
            href="/desk/47"
          >
            Open Desk 47
          </Link>
        </header>

        <section className="grid flex-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-between rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-[#8a5135]">
                Hour 0-2 checkpoint
              </p>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold sm:text-4xl">
                Scan a place, load a real route, and prove the data layer is
                ready.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#55615a]">
                This skeleton is wired for Next.js App Router, Tailwind,
                Supabase, OpenAI helpers, and QR generation. Desk 47 already
                renders from Supabase when credentials are present, with seeded
                fallback data protecting the demo while infrastructure is being
                connected.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatusTile label="Next.js" value="App Router" tone="green" />
              <StatusTile label="Supabase" value={isSupabaseConnected ? "Connected" : "Fallback"} tone={isSupabaseConnected ? "green" : "amber"} />
              <StatusTile label="Desk 47" value={desk47.location ? "Found" : "Missing"} tone={desk47.location ? "green" : "red"} />
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
            </dl>
            <Link
              className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#22352d] transition hover:bg-[#eef5f0]"
              href="/api/health"
            >
              View health JSON
            </Link>
          </aside>
        </section>
      </div>
    </main>
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
