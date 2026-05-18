import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocationById } from "@/lib/locations";

export const dynamic = "force-dynamic";

type DeskPageProps = {
  params: Promise<{
    locationId: string;
  }>;
};

export default async function DeskPage({ params }: DeskPageProps) {
  const { locationId } = await params;
  const result = await getLocationById(locationId);

  if (!result.location) {
    notFound();
  }

  const sourceLabel =
    result.source === "supabase" ? "Supabase" : "Seed fallback";

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col">
        <nav className="mb-6">
          <Link
            className="text-sm font-semibold text-[#1f4d3a] hover:text-[#173a2c]"
            href="/"
          >
            Back to status
          </Link>
        </nav>

        <section className="rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5a6f62]">
                Main Library
              </p>
              <h1 className="mt-3 text-4xl font-semibold">
                {result.location.name}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-[#55615a]">
                {result.location.description}
              </p>
            </div>
            <span className="rounded-full border border-[#b8d7c5] bg-[#eef7f1] px-3 py-1 text-sm font-semibold text-[#1f4d3a]">
              {sourceLabel}
            </span>
          </div>

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoCell label="Location ID" value={String(result.location.id)} />
            <InfoCell label="Building" value={result.location.building} />
            <InfoCell label="Floor" value={result.location.floor ?? "Unset"} />
          </dl>
        </section>

        <section className="mt-5 rounded-lg border border-dashed border-[#c6bda9] bg-[#fffaf0] p-6">
          <p className="text-sm font-semibold text-[#8a5135]">
            Archive shell ready
          </p>
          <p className="mt-2 text-sm leading-6 text-[#665d4f]">
            The next checkpoint fills this route with message cards, posting,
            and QR generation. The data path is already in place so the page can
            switch from seed data to Supabase as soon as environment variables
            and tables are configured.
          </p>
        </section>
      </div>
    </main>
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
