import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getLocationById } from "@/lib/locations";
import { getMessagesForLocation, type MessageRecord } from "@/lib/messages";
import { MessageComposer } from "./message-composer";

export const dynamic = "force-dynamic";

type DeskPageProps = {
  params: Promise<{
    locationId: string;
  }>;
};

export default async function DeskPage({ params }: DeskPageProps) {
  const { locationId } = await params;
  const [result, messageResult, deskUrl] = await Promise.all([
    getLocationById(locationId),
    getMessagesForLocation(locationId),
    getDeskUrl(locationId),
  ]);

  if (!result.location) {
    notFound();
  }

  const sourceLabel =
    result.source === "supabase" ? "Supabase" : "Seed fallback";
  const messagesSourceLabel =
    messageResult.source === "supabase" ? "Supabase" : "Seed fallback";
  const qrCodeDataUrl = await QRCode.toDataURL(deskUrl, {
    margin: 1,
    width: 220,
    color: {
      dark: "#1d2520",
      light: "#ffffff",
    },
  });

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-[#1d2520] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <nav className="mb-6">
          <Link
            className="text-sm font-semibold text-[#1f4d3a] hover:text-[#173a2c]"
            href="/"
          >
            Back to status
          </Link>
        </nav>

        <section className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="rounded-lg border border-[#d8d2c5] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5a6f62]">
                  {result.location.building}
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
          </div>

          <aside className="rounded-lg border border-[#d8d2c5] bg-[#22352d] p-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-[#b9d7c6]">Desk QR</p>
            <div className="mt-4 flex justify-center rounded-lg bg-white p-3">
              <Image
                alt={`QR code for ${result.location.name}`}
                height={190}
                src={qrCodeDataUrl}
                unoptimized
                width={190}
              />
            </div>
            <p className="mt-4 break-all text-sm leading-6 text-[#dbe9e2]">
              {deskUrl}
            </p>
          </aside>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#8a5135]">
                  {messageResult.messages.length} messages
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Archive at this desk
                </h2>
              </div>
              <span className="rounded-full border border-[#cfd8d4] bg-white px-3 py-1 text-sm font-semibold text-[#426052]">
                Messages from {messagesSourceLabel}
              </span>
            </div>

            {messageResult.error ? (
              <p className="mb-4 rounded-md border border-[#ecd0a4] bg-[#fff6e7] px-4 py-3 text-sm font-medium text-[#8a5135]">
                {messageResult.error}
              </p>
            ) : null}

            {messageResult.messages.length > 0 ? (
              <div className="space-y-4">
                {messageResult.messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#c6bda9] bg-white p-6 text-[#55615a]">
                No public messages are stored for this desk yet.
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <MessageComposer locationId={result.location.id} />
          </aside>
        </section>
      </div>
    </main>
  );
}

async function getDeskUrl(locationId: string) {
  const requestHeaders = await headers();
  const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    envBaseUrl ?? (host ? `${protocol}://${host}` : "http://localhost:3000");

  return `${baseUrl}/desk/${locationId}`;
}

function MessageCard({ message }: { message: MessageRecord }) {
  const tagList = [...message.tags, ...message.course_tags];

  return (
    <article className="rounded-lg border border-[#d8d2c5] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-[#23483a]">{message.pseudonym}</p>
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

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
