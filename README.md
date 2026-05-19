# DeskSupport / MyStudyFriend

QR-first campus place archive for the DevSoc Flagship Hackathon theme:
connection through places, time, and students who never meet.

## Product Flow

The QR code is a physical object outside the app.

Intended demo flow:

```text
physical QR code
-> phone camera
-> deployed /desk/47
-> Desk 47 archive page
```

The app is the destination after scanning. It does not generate QR codes, scan QR codes, or use browser camera APIs.

## Current Status

Hour 0-2 is complete locally:

- Next.js App Router project is set up.
- TypeScript, Tailwind, ESLint, Supabase, and OpenAI dependencies are installed.
- Supabase env vars are configured locally.
- `/api/health` can fetch Desk 47 from Supabase.
- Minimum tables exist: `locations`, `profiles`, and `messages`.

Hour 2-7 is complete locally:

- `/desk/47` renders the Desk 47 archive destination page.
- The page fetches public messages from Supabase.
- Desk 47 has seeded demo messages.
- The page shows mobile-friendly message cards with anonymous author labels, timestamps, tags, course tags, and upvotes.
- The page has a message form.
- `POST /api/messages` validates and saves new public messages.
- New posts get a stable per-desk anonymous label such as `Desk-47 Lantern`.

Still not complete:

- Vercel deployment has not been verified from this machine.
- Phone-camera QR scan has not been verified against a deployed URL.
- `APP_SECRET` should be configured before production/demo deployment.
- `OPENAI_API_KEY` is not configured locally yet.

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
OPENAI_API_KEY=
APP_SECRET=
```

Needed now:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_SECRET`

`APP_SECRET` is server-only. Do not name it `NEXT_PUBLIC_APP_SECRET`. It is used to create stable anonymous per-desk labels from the browser's local demo user id.

Needed later:

- `OPENAI_API_KEY` for embeddings and moderation

## Supabase Bootstrap

Run these SQL files in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

The schema includes `messages.author_label`, used as the canonical anonymous per-desk display label.

If your Supabase project existed before this cleanup, rerun `supabase/schema.sql` so the existing `messages` table gets the new `author_label` column.

If old rows already have good values in `pseudonym` but still show `author_label = 'Anonymous Student'`, run this backfill in the Supabase SQL editor:

```sql
update messages
set author_label = pseudonym
where author_label = 'Anonymous Student'
  and pseudonym is not null
  and pseudonym <> ''
  and pseudonym <> 'Anonymous Student';
```

This copies existing good pseudonyms into the new canonical `author_label` column. Rows where both fields are `Anonymous Student` are old test data and can be cleaned manually before the final demo.

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
- `/desk/47` does not show a QR panel or raw localhost/deployed URL.
- Submitting a safe message returns HTTP 201 from `POST /api/messages`.
- Refreshing `/desk/47` shows the submitted message.
- A new message has a stable anonymous label.
- Supabase has the `messages.author_label` column after rerunning `supabase/schema.sql`.

## Main Files

- `app/desk/[locationId]/page.tsx` renders the desk archive destination page.
- `app/desk/[locationId]/message-composer.tsx` handles the browser-side message form and local demo user id.
- `app/api/messages/route.ts` saves new messages to Supabase and creates author labels.
- `app/api/health/route.ts` reports location/message health.
- `lib/author-label.ts` chooses the best display label during the `pseudonym` to `author_label` migration.
- `lib/pseudonym.ts` creates stable anonymous per-desk labels.
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
