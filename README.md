# DeskSupport / MyStudyFriend

QR-first campus place archive for the DevSoc Flagship Hackathon theme:
connection through places, time, and students who never meet.

## Current Status

Hour 0-2 is complete locally:

- Next.js App Router project is set up.
- TypeScript, Tailwind, ESLint, Supabase, OpenAI, and QR dependencies are installed.
- Supabase env vars are configured locally.
- `/api/health` can fetch Desk 47 from Supabase.
- Minimum tables exist: `locations`, `profiles`, and `messages`.

Hour 2-7 is complete locally:

- `/desk/47` renders the real Desk 47 archive page.
- The page fetches public messages from Supabase.
- Desk 47 has seeded demo messages.
- The page shows mobile-friendly message cards with pseudonyms, timestamps, tags, course tags, and upvotes.
- The page has a message form.
- `POST /api/messages` validates and saves new public messages.
- The page includes a QR code for the desk URL.

Still not complete:

- Vercel deployment has not been verified from this machine.
- Phone-camera QR scan has not been verified against a deployed URL.
- `OPENAI_API_KEY`, `APP_SECRET`, and `NEXT_PUBLIC_SITE_URL` are not configured locally yet.

## Setup

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/desk/47`
- `http://localhost:3000/api/health`

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
OPENAI_API_KEY=
APP_SECRET=
```

Needed now:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Needed later:

- `NEXT_PUBLIC_SITE_URL` for deployed QR URLs
- `OPENAI_API_KEY` for embeddings and moderation
- `APP_SECRET` for signed QR tokens and pseudonyms

## Supabase Bootstrap

Run these SQL files in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

The seed file includes:

- 8 locations
- 24 Desk 47 public messages
- 4 messages across other demo locations

## Verification

```bash
npm run lint
npm run build
```

Then check:

- `/api/health` reports `desk47.source: "supabase"`.
- `/api/health` reports a positive `desk47Messages.count`.
- `/desk/47` shows seeded messages.
- Submitting a safe message returns HTTP 201 from `POST /api/messages`.
- Refreshing `/desk/47` shows the submitted message.

## Main Files

- `app/desk/[locationId]/page.tsx` renders the desk archive page.
- `app/desk/[locationId]/message-composer.tsx` handles the browser-side message form.
- `app/api/messages/route.ts` saves new messages to Supabase.
- `app/api/health/route.ts` reports location/message health.
- `lib/locations.ts` fetches locations with fallback data.
- `lib/messages.ts` fetches messages with fallback data.
- `lib/demoData.ts` stores local fallback locations and messages.
- `supabase/schema.sql` creates tables and RLS policies.
- `supabase/seed.sql` seeds demo locations and messages.

## Handoffs

- `docs/hour-0-2-debugging-handoff.md`
- `docs/hour-2-7-debugging-handoff.md`
- `docs/detailed-execution-guide.md`

Read the relevant handoff before continuing to the next checkpoint.
