# Hour 2-7 Debugging Handoff

Date: 2026-05-19

This document explains what I did for Hours 2-7, why I did it, what happened after each step, and how a human teammate can debug it.

## Goal For Hours 2-7

The execution guide says Hours 2-7 should build the core QR archive loop.

The target flow is:

```text
open /desk/47
-> fetch Desk 47
-> fetch messages for Desk 47
-> show message cards
-> submit a message
-> save it to Supabase
-> refresh and see it in the archive
```

This is the minimum product spine. Later work like onboarding, ranking, presence, moderation, and pseudonyms depends on this working first.

## Starting State

Before I started Hour 2-7:

- `/api/health` showed Desk 47 coming from Supabase.
- Supabase env vars were working.
- `locations`, `profiles`, and `messages` tables existed.
- `/desk/47` only showed a location shell.
- The page did not show messages yet.
- There was no message form.
- There was no `POST /api/messages`.
- The live Supabase database had 0 public messages for Desk 47.

The health JSON from the user showed:

```json
{
  "ok": true,
  "app": "MyStudyFriend",
  "checkpoint": "hours-0-2",
  "supabaseConfigured": true,
  "desk47": {
    "source": "supabase",
    "location": {
      "id": 47,
      "name": "Desk 47",
      "building": "Main Library",
      "floor": "Level 3"
    }
  }
}
```

That meant Hour 0-2 was good enough to continue.

## Step-By-Step: What I Did

### Step 1: I inspected the repo and schema

What I did:

- Checked `git status`.
- Read `supabase/schema.sql`.
- Read `supabase/seed.sql`.
- Checked whether the local dev server was running.

Why I did it:

- I needed to know if the app was already clean and whether the database had the right table shape.

What happened after:

- The repo only had one uncommitted doc file: `docs/detailed-execution-guide.md`.
- The `messages` table already existed in the schema.
- The seed file only had locations, not real messages.
- The local dev server was not running.

### Step 2: I added fallback demo messages

What I did:

- Updated `lib/demoData.ts`.
- Added a `DemoMessage` type.
- Added 28 fallback messages:
  - 24 for Desk 47
  - 4 across other demo locations
- Added `getDemoMessagesForLocation(locationId)`.

Why I did it:

- The app should not go blank if Supabase message fetching fails.
- The execution guide says empty databases are not acceptable for the emotional demo.

What happened after:

- The app has local backup messages.
- If Supabase message fetching fails, Desk 47 can still show a meaningful archive.

### Step 3: I added a message fetch helper

What I did:

- Created `lib/messages.ts`.
- Added `getMessagesForLocation(locationId)`.

Why I did it:

- Pages should not talk directly to Supabase everywhere.
- The fallback logic should live in one file.

What happened after:

- The desk page can ask for messages without knowing if they come from Supabase or fallback data.
- The helper returns:
  - `messages`
  - `source`
  - optional `error`

Simple flow:

```text
desk page asks for messages
-> getMessagesForLocation("47")
-> try Supabase
-> if Supabase fails, use demoData
-> return messages and source
```

### Step 4: I added the message POST API

What I did:

- Created `app/api/messages/route.ts`.
- Added a `POST` handler.

Why I did it:

- The archive needs to let users leave messages.
- Saving messages should happen through a server API route, not directly inside the page UI.

What happened after:

- The app has `POST /api/messages`.
- It accepts JSON:

```json
{
  "locationId": 47,
  "body": "message text"
}
```

- It validates:
  - request is valid JSON
  - `locationId` exists
  - `locationId` is a whole number
  - body is not empty
  - body is 1000 characters or fewer
  - location exists in Supabase
- It inserts into `messages`.
- It returns HTTP 201 with the saved message.

### Step 5: I added the message form

What I did:

- Created `app/desk/[locationId]/message-composer.tsx`.
- This is a client component.

Why I did it:

- The form needs browser interactivity:
  - typing
  - submit event
  - success state
  - error state
  - page refresh after posting

What happened after:

- The desk page has a textarea and submit button.
- On submit, it calls `/api/messages`.
- If the API succeeds, it clears the textarea and refreshes the server-rendered archive.
- If the API fails, it shows the error message.

### Step 6: I replaced the Desk 47 shell with the archive page

What I did:

- Rewrote `app/desk/[locationId]/page.tsx`.

Why I did it:

- The page needed to become the actual archive screen.

What happened after:

- `/desk/47` now shows:
  - location header
  - Supabase/fallback location source
  - QR code
  - desk URL
  - message count
  - message source
  - message cards
  - message form

### Step 7: I added QR code generation

What I did:

- Used the installed `qrcode` package inside the desk page.
- Generated a QR data URL for the current desk URL.

Why I did it:

- The execution guide says the QR should contain the deployed desk URL.
- We do not need a scanner library because phones already scan QR codes.

What happened after:

- The page displays a QR code.
- Locally it points at the local desk URL.
- On Vercel, it should use `NEXT_PUBLIC_SITE_URL` if that env var is set.

Important note:

- Add `NEXT_PUBLIC_SITE_URL` in Vercel so the QR points at the deployed app, not localhost.

### Step 8: I updated the health endpoint

What I did:

- Updated `app/api/health/route.ts`.

Why I did it:

- The old health endpoint only checked Desk 47.
- Hour 2-7 also needs to know if Desk 47 has messages.

What happened after:

- `/api/health` now returns:
  - `desk47`
  - `desk47Messages`
- `desk47Messages.count` tells us how many public Desk 47 messages are visible.

### Step 9: I updated the seed SQL

What I did:

- Updated `supabase/seed.sql`.
- Added 28 seeded messages.

Why I did it:

- A fresh Supabase project should be able to seed real demo messages.
- Desk 47 needs strong content before live posting.

What happened after:

- Running `supabase/seed.sql` now creates:
  - 8 locations
  - 24 Desk 47 messages
  - 4 messages across other locations

### Step 10: I seeded the live database

What I did:

- Checked `/api/health`.
- It showed `desk47Messages.count: 0`.
- Tried a one-off Supabase JS seed script.
- That failed locally because Node 20.15 does not have the websocket support expected by the Supabase realtime client.
- Switched to Supabase REST API.
- Inserted only missing seed rows.

Why I did it:

- The code was ready, but the actual live Supabase database had no messages.
- The definition of done requires seeded messages.

What happened after:

- 24 new Desk 47 seed messages were inserted into Supabase.
- `/api/health` reported `desk47Messages.count: 24`.

### Step 11: I verified posting

What I did:

- Sent a real POST request to `/api/messages`.
- Body:

```text
Hour 2-7 verification message: posting from the archive saves to Supabase.
```

Why I did it:

- The definition of done says submitting a message should save and appear on refresh.

What happened after:

- API returned HTTP 201.
- Supabase saved the message.
- `/api/health` increased from 24 to 25 messages.
- `/desk/47` contained the posted verification message.

Inserted verification message id:

```text
fad44baf-e42b-410a-b787-20859047ecd5
```

## Every File Changed For Hour 2-7

### `.env.example`

What changed:

- Added `NEXT_PUBLIC_SITE_URL`.

Why:

- QR codes need to know the deployed site URL.

### `lib/demoData.ts`

What changed:

- Added fallback message data.
- Added `DemoMessage`.
- Added `getDemoMessagesForLocation`.

Why:

- The archive should not be empty if Supabase message fetching fails.

### `lib/messages.ts`

What changed:

- New file.
- Fetches messages from Supabase.
- Falls back to local demo messages if needed.

Why:

- Keeps message data logic out of page components.

### `app/api/messages/route.ts`

What changed:

- New API route.
- Saves messages to Supabase.

Why:

- The message form needs a backend endpoint.

### `app/desk/[locationId]/message-composer.tsx`

What changed:

- New client component.
- Handles textarea, submit, success, error, and refresh.

Why:

- Form interaction must run in the browser.

### `app/desk/[locationId]/page.tsx`

What changed:

- Replaced archive shell with real archive UI.
- Fetches location and messages.
- Shows message cards.
- Shows QR code.
- Shows composer.

Why:

- This is the core QR archive loop.

### `app/api/health/route.ts`

What changed:

- Added message health.
- Changed checkpoint to `hours-2-7`.

Why:

- Debugging now needs to know message count and message data source.

### `supabase/seed.sql`

What changed:

- Added seeded messages.

Why:

- Fresh databases need demo content.

### `README.md`

What changed:

- Updated project status for Hour 0-2 and Hour 2-7.
- Added Hour 2-7 verification notes and file map.

Why:

- README should match the current project state.

## Current Runtime Behavior

`/desk/47`:

- Fetches Desk 47 from Supabase.
- Fetches public messages from Supabase.
- Displays seeded messages.
- Displays QR code.
- Lets the user post a message.

`/api/messages`:

- Accepts `POST`.
- Saves valid messages to Supabase.
- Rejects invalid requests.

`/api/health`:

- Confirms Supabase is configured.
- Confirms Desk 47 source.
- Confirms Desk 47 message source and count.

Current checked result:

```json
{
  "ok": true,
  "checkpoint": "hours-2-7",
  "supabaseConfigured": true,
  "desk47": {
    "source": "supabase"
  },
  "desk47Messages": {
    "source": "supabase",
    "count": 25
  }
}
```

## Verification Performed

Commands:

```bash
npm run lint
npm run build
```

Both passed.

Local route checks:

- `GET /api/health` passed.
- `GET /desk/47` returned HTTP 200.
- Page HTML contained `Archive at this desk`.
- Page HTML contained `Desk QR`.
- Page HTML contained the message form label.
- Page HTML contained seeded message text.

Posting check:

- `POST /api/messages` returned HTTP 201.
- `/api/health` message count increased.
- `/desk/47` contained the posted verification message.

## Known Issues Or Gaps

Vercel is still not verified.

Why this matters:

- The definition of done says the phone should scan a QR and open the deployed URL.
- Localhost cannot satisfy that.

What to do:

1. Push the latest changes.
2. Deploy to Vercel.
3. Add Vercel env vars.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed base URL.
5. Open deployed `/api/health`.
6. Scan deployed Desk 47 QR on a phone.

Moderation is not built yet.

Why:

- Moderation belongs to Hours 22-25.

Current risk:

- The current API accepts any non-empty message up to 1000 characters.

Onboarding and ranking are not built yet.

Why:

- They belong to later checkpoints.

Current behavior:

- Messages are shown newest-first.

## Debugging Guide

### If `/desk/47` shows no messages

Check:

1. Open `/api/health`.
2. Look at `desk47Messages.count`.
3. If count is 0, run `supabase/seed.sql` in Supabase.
4. If source is `seed-fallback`, read `desk47Messages.error`.
5. Confirm the `messages` table exists.
6. Confirm RLS allows selecting public messages.

### If posting fails

Check:

1. Browser/network response from `/api/messages`.
2. The JSON error returned by the API.
3. Whether `.env.local` has Supabase URL and anon key.
4. Whether the location exists in `locations`.
5. Whether RLS allows insert into `messages`.

### If QR points to localhost on Vercel

Fix:

1. Add `NEXT_PUBLIC_SITE_URL` in Vercel.
2. Set it to the deployed app URL.
3. Redeploy.

### If the app falls back to demo messages

Meaning:

- Supabase message fetch failed.

Check:

1. `/api/health`.
2. `desk47Messages.error`.
3. Supabase table name.
4. RLS select policy.
5. Env vars.

## Next Checkpoint

Continue to Hours 7-12: onboarding/profile.

Do not start embeddings, live presence, moderation, or signed QR tokens until:

- deployed Desk 47 page loads
- QR scan opens Desk 47 on a phone
- messages show
- posting works
