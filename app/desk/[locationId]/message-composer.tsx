"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type MessageComposerProps = {
  locationId: number;
  locationName: string;
};

const maxMessageLength = 1000;
const demoUserStorageKey = "demo_user_id";

const INK     = "#1F1B16";
const INK_2   = "#4A4137";
const INK_3   = "#7A6F60";
const PAPER   = "#FBF8F2";
const BG_2    = "#ECE5D8";
const RULE    = "#DDD3C0";
const ACCENT  = "#F0B49A";
const SANS    = "var(--font-geist-sans), system-ui, sans-serif";
const SERIF   = "var(--font-instrument-serif), Georgia, serif";
const MONO    = "var(--font-geist-mono), ui-monospace, monospace";

export function MessageComposer({ locationId, locationName }: MessageComposerProps) {
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
        headers: { "Content-Type": "application/json" },
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
    <section style={{ padding: "44px 28px 40px", background: BG_2 }}>
      {/* Section eyebrow */}
      <div style={{
        fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em",
        color: INK_3, textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ color: ACCENT }}>✱</span>
        <span style={{ width: 18, height: 1, background: RULE, display: "inline-block" }} />
        <span>Write</span>
      </div>

      <h2 style={{
        fontFamily: SERIF, fontWeight: 400,
        fontSize: 36, lineHeight: 1.02, letterSpacing: "-0.018em",
        color: INK, margin: "14px 0 22px",
      }}>
        Leave a note for{" "}
        <em style={{ fontStyle: "italic", color: ACCENT }}>the next student</em>.
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative" }}>
          <textarea
            id="message-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, maxMessageLength))}
            placeholder="Write something kind, useful, or honest about studying here."
            rows={5}
            style={{
              width: "100%",
              background: PAPER,
              border: `1px solid ${RULE}`,
              borderRadius: 14,
              padding: "16px 16px 44px",
              fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55,
              color: INK,
              resize: "none", outline: "none",
              transition: "border-color 120ms ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = RULE; }}
          />
          <div style={{
            position: "absolute", left: 16, bottom: 14,
            fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em",
            color: INK_3, textTransform: "uppercase",
            pointerEvents: "none",
          }}>
            {body.length}/{maxMessageLength}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginTop: 16,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
            color: INK_3, textTransform: "uppercase",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Posted anonymously
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 20px",
              background: isSubmitting ? INK_3 : INK,
              color: PAPER,
              border: "none", borderRadius: 100,
              fontFamily: SANS, fontSize: 14, fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              letterSpacing: "0.01em",
              transition: "background 120ms ease",
            }}
          >
            {isSubmitting ? "Posting…" : "Post note"}
            {!isSubmitting && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p style={{
            marginTop: 14, padding: "12px 16px",
            background: "#FFF0EE", border: "1px solid #EFAFA6",
            borderRadius: 10,
            fontFamily: SANS, fontSize: 13, color: "#943C30",
          }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{
            marginTop: 14, padding: "12px 16px",
            background: "#EEF7F1", border: "1px solid #B8D7C5",
            borderRadius: 10,
            fontFamily: SANS, fontSize: 13, color: "#1F4D3A",
          }}>
            {success}
          </p>
        )}
      </form>
    </section>
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
