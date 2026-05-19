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

Hour 7-12 is complete locally:

- A fresh browser sees onboarding before the Desk 47 archive.
- Demo personas are available inside onboarding: Alex and Jamie.
- Manual course selection is available with the static course list.
- The selected study profile is saved in browser `localStorage` under `mystudyfriend_profile`.
- Returning in the same browser skips onboarding.
- The archive shows a profile banner and a `Switch profile` control.
- Supabase Auth is intentionally not built yet.

Hour 12-18 Stage A is complete locally:

- Desk 47 messages are reordered from the saved local study profile.
- Alex sees COMP2521/MATH1081 messages near the top.
- Jamie sees FINS1613/ECON1101 messages near the top.
- The top 3 ranked messages show small "why this message" labels.
- Ranking is deterministic and does not require OpenAI.

Hour 12-18 Stage B fallback layer is implemented:

- `POST /api/ranked-messages` returns ranked messages for the local profile.
- If embeddings are unavailable, it returns Stage A deterministic ranking.
- If `OPENAI_API_KEY`, pgvector, and embedded rows are available, it adds semantic similarity.
- `POST /api/admin/embed-messages` can embed missing public messages in small batches.
- The admin embedding route requires `ADMIN_SECRET` in production and `SUPABASE_SERVICE_ROLE_KEY` for database updates.

Still not complete:

- Vercel deployment has not been verified from this machine.
- Phone-camera QR scan has not been verified against a deployed URL.
- `APP_SECRET` should be configured before production/demo deployment.
- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_SECRET` are needed only for Stage B embedding administration.

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
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET=
```

Needed now:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_SECRET`

`APP_SECRET` is server-only. Do not name it `NEXT_PUBLIC_APP_SECRET`. It is used to create stable anonymous per-desk labels from the browser's local demo user id.

Needed later:

- `OPENAI_API_KEY` for embeddings and moderation
- `SUPABASE_SERVICE_ROLE_KEY` for the admin embedding batch route
- `ADMIN_SECRET` to protect admin routes in production

Local env note:

- When running the app from the `DeskSupport` folder, Next.js reads `DeskSupport/.env.local`.
- A `.env.local` in the parent `Hackathon` folder will not activate Stage B for this app.
- Never commit `.env.local`.

## Supabase Bootstrap

Run these SQL files in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

The schema includes `messages.author_label`, used as the canonical anonymous per-desk display label.

The schema also includes the optional Stage B vector setup:

- `messages.embedding extensions.vector(1536)`
- `match_messages_for_location(...)`

If pgvector setup blocks demo prep, leave embeddings empty. The app falls back to deterministic Stage A ranking.

To verify the optional Stage B schema, run:

```sql
select extname from pg_extension where extname = 'vector';

select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'messages'
  and column_name = 'embedding';

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'match_messages_for_location';
```

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
- 28 Desk 47 public messages
- 4 messages across other demo locations

## Local Stage B Embedding Test

Stage B is optional. The demo still works with Stage A if any embedding setup is missing.

1. Add these to `DeskSupport/.env.local`:

```bash
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET=
```

2. Restart the dev server:

```bash
Ctrl+C
npm run dev
```

3. Run the latest `supabase/schema.sql` in the Supabase SQL editor.

4. Check what the local Next.js app can see:

```powershell
Invoke-RestMethod http://localhost:3000/api/debug/env-check
```

Expected shape:

```json
{
  "hasOpenAIKey": true,
  "hasServiceRoleKey": true,
  "hasAdminSecret": true
}
```

This endpoint only exists in development and returns booleans, never secret values.

5. Check the admin embedding status:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri http://localhost:3000/api/admin/embed-messages `
  -Headers @{ "x-admin-secret" = "<ADMIN_SECRET_FROM_ENV_LOCAL>" }
```

The response should include:

```text
totalPublicMessages
missingEmbeddings
embeddedMessages
```

6. Embed a small batch:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/admin/embed-messages `
  -ContentType "application/json" `
  -Headers @{ "x-admin-secret" = "<ADMIN_SECRET_FROM_ENV_LOCAL>" } `
  -Body '{"batchSize":10}'
```

Repeat until `missingEmbeddings` is `0`.

7. Test ranked messages:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/ranked-messages `
  -ContentType "application/json" `
  -Body '{"locationId":47,"profile":{"profileId":"alex","displayName":"Alex","courses":["COMP2521","MATH1081"]}}'
```

Expected behavior:

- If env vars exist but no messages are embedded yet, `mode` stays `stage-a` and the warning says no embedded messages were found.
- If pgvector or the RPC is missing, `mode` stays `stage-a` and the warning says vector search is not ready.
- If OpenAI rejects the request because of quota, billing, or key permissions, `mode` stays `stage-a` and the warning says the OpenAI fallback reason.
- After embeddings exist, `mode` becomes `stage-b` and messages include `semantic_similarity`.

## Verification

```bash
npm run lint
npm run build
```

Then check:

- `/api/health` reports `desk47.source: "supabase"`.
- `/api/health` reports a positive `desk47Messages.count`.
- Clearing `localStorage` and opening `/desk/47` shows onboarding.
- Selecting Alex unlocks the archive and shows `Personalised for Alex · COMP2521 · MATH1081`.
- Refreshing `/desk/47` skips onboarding in the same browser.
- Switching to Jamie updates the banner to `Personalised for Jamie · FINS1613 · ECON1101`.
- Alex's top messages include COMP2521/MATH1081 content and why labels.
- Jamie's top messages include FINS1613/ECON1101 content and why labels.
- `/desk/47` does not show a QR panel or raw localhost/deployed URL.
- Submitting a safe message returns HTTP 201 from `POST /api/messages`.
- Refreshing `/desk/47` shows the submitted message.
- A new message has a stable anonymous label.
- Supabase has the `messages.author_label` column after rerunning `supabase/schema.sql`.

## Main Files

- `app/desk/[locationId]/page.tsx` renders the desk archive destination page.
- `app/desk/[locationId]/desk-archive-client.tsx` checks the local study profile, shows onboarding, and unlocks the archive.
- `app/desk/[locationId]/message-composer.tsx` handles the browser-side message form and local demo user id.
- `app/api/ranked-messages/route.ts` ranks messages from the local profile, using embeddings only when available.
- `app/api/admin/embed-messages/route.ts` embeds missing public messages for developers.
- `app/api/messages/route.ts` saves new messages to Supabase and creates author labels.
- `app/api/health/route.ts` reports location/message health.
- `lib/author-label.ts` chooses the best display label during the `pseudonym` to `author_label` migration.
- `lib/pseudonym.ts` creates stable anonymous per-desk labels.
- `lib/ranking.ts` builds the profile context string and ranks messages for the saved study profile.
- `lib/openai.ts` creates embeddings with `text-embedding-3-small`.
- `lib/vector.ts` converts embedding arrays into pgvector literals.
- `lib/locations.ts` fetches locations with fallback data.
- `lib/messages.ts` fetches messages with fallback data.
- `lib/demoData.ts` stores local fallback locations and messages.
- `supabase/schema.sql` creates tables and RLS policies.
- `supabase/seed.sql` seeds demo locations and messages.

## Handoffs

- `docs/hour-0-2-debugging-handoff.md`
- `docs/hour-2-7-debugging-handoff.md`
- `docs/hour-7-12-debugging-handoff.md`
- `docs/hour-12-18-debugging-handoff.md`
- `docs/detailed-execution-guide.md`

Read the relevant handoff before continuing to the next checkpoint.
