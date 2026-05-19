"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type MessageComposerProps = {
  locationId: number;
  locationName: string;
};

const maxMessageLength = 1000;
const demoUserStorageKey = "demo_user_id";

export function MessageComposer({
  locationId,
  locationName,
}: MessageComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBody = body.trim();
    setError(null);
    setSuccess(null);

    if (!trimmedBody) {
      setError("Write a message before posting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          body: trimmedBody,
          demoUserId: getOrCreateDemoUserId(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Message could not be posted.");
        return;
      }

      setBody("");
      setSuccess(`Posted — your note is now part of ${locationName}.`);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-[#cfd8d4] bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <label
        className="text-sm font-semibold text-[#23483a]"
        htmlFor="message-body"
      >
        Leave a note for the next student
      </label>
      <textarea
        className="mt-3 min-h-32 w-full resize-y rounded-md border border-[#cfd8d4] bg-[#fbfdfc] p-4 text-base leading-7 text-[#1d2520] outline-none transition focus:border-[#1f7a5a] focus:ring-2 focus:ring-[#bfe7d4]"
        id="message-body"
        maxLength={maxMessageLength}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write something kind, useful, or honest about studying here."
        value={body}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#63706a]">
          {body.length}/{maxMessageLength}
        </p>
        <button
          className="rounded-full bg-[#1f4d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a2c] disabled:cursor-not-allowed disabled:bg-[#9aa8a1]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Posting..." : "Post message"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-[#efb3aa] bg-[#fff0ee] px-3 py-2 text-sm font-medium text-[#943c30]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-md border border-[#b8d7c5] bg-[#eef7f1] px-3 py-2 text-sm font-medium text-[#1f4d3a]">
          {success}
        </p>
      ) : null}
    </form>
  );
}

function getOrCreateDemoUserId() {
  const existingUserId = window.localStorage.getItem(demoUserStorageKey);

  if (existingUserId) {
    return existingUserId;
  }

  const nextUserId = window.crypto.randomUUID();
  window.localStorage.setItem(demoUserStorageKey, nextUserId);

  return nextUserId;
}
