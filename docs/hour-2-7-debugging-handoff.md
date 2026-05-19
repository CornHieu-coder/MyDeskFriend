# Hour 2-7 Debugging Handoff

Date: 2026-05-19

This document explains the current Hour 2-7 archive loop after the pre-onboarding cleanup.

Important correction:

- `/desk/47` is the destination after a physical QR code is scanned.
- The app does not generate QR codes.
- The app does not show QR codes.
- The app does not show raw localhost/deployed URLs.
- The app does not use browser camera APIs.

## Goal For Hours 2-7

Build the core archive loop:

```text
open /desk/47
-> fetch Desk 47
-> fetch messages for Desk 47
-> show message cards
-> submit a message
-> save it to Supabase
-> refresh and see it in the archive
```

## What Was Built

- `app/desk/[locationId]/page.tsx` renders the student-facing archive page.
- `lib/messages.ts` fetches messages from Supabase with fallback demo data.
- `app/desk/[locationId]/message-composer.tsx` lets a user post a message.
- `app/api/messages/route.ts` validates and saves new messages.
- `lib/pseudonym.ts` creates stable anonymous per-desk labels.
- `supabase/schema.sql` now includes `messages.author_label`.
- `supabase/seed.sql` seeds demo messages and backfills `author_label` from older `pseudonym` values.

## What Was Removed

Removed from `/desk/47`:

- QR code panel
- QR generation
- raw URL display
- `NEXT_PUBLIC_SITE_URL` dependency
- debug labels like `Messages from Supabase`
- student-visible Supabase/fallback source labels

Removed from dependencies:

- `qrcode`
- `@types/qrcode`

## How The Page Works Now

When a user opens `/desk/47`:

1. Next.js loads `app/desk/[locationId]/page.tsx`.
2. The page reads `locationId` from the URL.
3. The page calls `getLocationById(locationId)`.
4. The page calls `getMessagesForLocation(locationId)`.
5. The page renders:
   - location name
   - building
   - floor
   - archive count
   - message cards
   - message composer
6. Debug source information appears only in development mode.

## Stable Anonymous Author Labels

Goal:

New messages should show labels like:

```text
Desk-47 Lantern
Desk-47 Owl
```

How it works:

1. The browser stores a local `demo_user_id` in `localStorage`.
2. If the browser has no `demo_user_id`, the composer creates one with `crypto.randomUUID()`.
3. The composer sends `demoUserId` to `POST /api/messages`.
4. The server does not store `demoUserId`.
5. The server creates an HMAC using `APP_SECRET`, `demoUserId`, and `locationId`.
6. The hash chooses a noun from:

```text
Lantern, Owl, Fox, Koala, Comet, Echo, Wombat, Maple, Orbit, Finch
```

7. The final label is saved as `messages.author_label`.
8. The same value is also written to the old `messages.pseudonym` field for hackathon compatibility.
9. `author_label` is now the canonical display column.

Expected behavior:

- Same browser + Desk 47 gets the same label.
- Same browser + Desk 48 gets a different label because the desk prefix changes.
- Different browser + Desk 47 usually gets a different label.
- The user never types a username.

## APP_SECRET Behavior

`APP_SECRET` is server-only.

Do not use:

```text
NEXT_PUBLIC_APP_SECRET
```

In development:

- If `APP_SECRET` is missing, the server uses a development-only fallback and logs a warning.

In production:

- If `APP_SECRET` is missing, posting returns a helpful error.

Before Vercel deployment, add:

```text
APP_SECRET
```

to Vercel environment variables.

## Hydration Warning Investigation

The reported warning involved:

```text
bis_skin_checked="1"
```

This is usually injected by a browser extension.

Current code check:

- The message composer does not read `localStorage` during first render.
- It only reads/writes `localStorage` during submit.
- There is no `Date.now()` in first render.
- There is no `Math.random()` in first render.
- Date formatting happens in a server component.

Next check if warning appears again:

1. Open the page in Incognito with extensions disabled.
2. If the warning disappears, it was extension-caused.
3. If it still appears, inspect client components for browser-only reads during first render.

## Files Changed

### `.env.example`

Removed:

- `NEXT_PUBLIC_SITE_URL`

Kept:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `APP_SECRET`

### `app/desk/[locationId]/page.tsx`

Changed:

- Removed QR UI.
- Removed URL display.
- Removed judge-visible debug labels.
- Shows only product content.

### `app/desk/[locationId]/message-composer.tsx`

Changed:

- Creates/reads `demo_user_id` from `localStorage` during submit.
- Sends `demoUserId` to the API.
- Disables the submit button while posting.
- Keeps character count.
- Shows:

```text
Posted — your note is now part of Desk 47.
```

### `app/api/messages/route.ts`

Changed:

- Receives `demoUserId`.
- Derives author label server-side.
- Inserts `author_label`.
- Also inserts `pseudonym` for backward compatibility.
- Does not store `demoUserId`.

### `lib/pseudonym.ts`

New file.

Purpose:

- Builds stable per-location anonymous labels using Node crypto HMAC SHA-256.

### `lib/author-label.ts`

New file.

Purpose:

- Chooses the label that should appear on message cards.
- Uses `author_label` first only when it is not `Anonymous Student`.
- Falls back to the old `pseudonym` column if it contains a useful generated label.
- Returns `Anonymous Student` only when neither column has a useful value.

### `lib/messages.ts`

Changed:

- Reads all message columns with `select("*")`.
- Uses `getDisplayAuthorLabel`.
- Normalizes old messages by falling back to the first useful label:

```text
author_label if it is not "Anonymous Student"
then pseudonym if it is not "Anonymous Student"
then Anonymous Student
```

### `lib/demoData.ts`

Changed:

- Fallback messages now include `author_label`.

### `lib/supabase/database.types.ts`

Changed:

- Added `author_label` to `messages`.

### `supabase/schema.sql`

Changed:

- Added `author_label text not null default 'Anonymous Student'`.
- Added an `alter table` statement so existing projects can add the column.
- Added a corrected backfill from `pseudonym` to `author_label`.
- Added a database comment marking `author_label` as the canonical display column.

Backfill SQL:

```sql
update messages
set author_label = pseudonym
where author_label = 'Anonymous Student'
  and pseudonym is not null
  and pseudonym <> ''
  and pseudonym <> 'Anonymous Student';
```

Why this matters:

- Old rows may already have good labels like `Desk-47 Owl` in `pseudonym`.
- The newer `author_label` column may still contain its default value, `Anonymous Student`.
- This SQL copies the useful old label into the new canonical column.

Important:

- The repository schema is updated.
- The live Supabase database still needs this SQL to be rerun if it was created before the cleanup.
- Until then, the API writes the stable label to `pseudonym` as a compatibility fallback.

### `supabase/seed.sql`

Changed:

- Seeds remain idempotent.
- Adds/backfills `author_label` for seeded messages.

### `README.md`

Changed:

- Explains physical QR flow.
- Documents `APP_SECRET`.
- Removes `NEXT_PUBLIC_SITE_URL`.

## Debugging Guide

### If `/desk/47` shows QR or raw URL

You are not on the latest code.

Check:

```bash
git status
git log --oneline -3
```

Then restart:

```bash
npm run dev
```

### If posting fails with an author label error

Check:

1. Run `supabase/schema.sql` in Supabase.
2. Confirm `messages.author_label` exists.
3. Confirm `APP_SECRET` exists for production/deployed environments.

### If a new message shows `Anonymous Student`

Possible reasons:

1. `author_label` column is missing.
2. Old message row has no useful `author_label` yet.
3. The API fell back to `pseudonym` compatibility mode.

Fix:

1. Run `supabase/schema.sql`.
2. Run the backfill SQL above if existing rows have good `pseudonym` values.
3. Post a new message.

### If hydration warnings mention `bis_skin_checked`

Likely cause:

- browser extension DOM injection

Check:

- Incognito with extensions disabled.

## Verification Checklist

Run:

```bash
npm run lint
npm run build
```

Local checks:

1. `/api/health` works.
2. `/desk/47` loads messages.
3. `/desk/47` does not show QR.
4. `/desk/47` does not show raw localhost URL.
5. Submit message works.
6. New message shows a `Desk-47 ...` label.
7. Refreshing does not change the same browser label.

Deployed checks:

1. Deployed `/desk/47` loads messages.
2. Deployed `/desk/47` does not show QR or localhost URL.
3. Posting works.
4. New messages show stable anonymous author labels.

## Latest Local Verification

Performed after removing QR UI and adding stable labels:

- `npm run lint` passed.
- `npm run build` passed.
- `/api/health` returned `ok: true`.
- `/desk/47` loaded messages.
- `/desk/47` did not contain `Desk QR`.
- `/desk/47` did not contain `QR code`.
- `/desk/47` did not contain `localhost`.
- Posting two messages with the same demo user id returned the same label:

```text
Desk-47 Owl
```

- The new message appeared on refresh.

Author-label migration note:

```text
Some rows may have pseudonym = "Desk-47 Owl" but author_label = "Anonymous Student".
```

That means the useful generated label exists, but it is still in the old `pseudonym` column. Run the backfill SQL in this handoff so `author_label` becomes the canonical display value. The app also has a display fallback so these rows still render with the better `pseudonym` label before the database is cleaned.

## Author Label Migration Fix

This section records the later bug fix where `pseudonym` had good labels but `author_label` still showed `Anonymous Student`.

### What was wrong

The database had two label columns:

```text
pseudonym
author_label
```

`pseudonym` was the older column.

`author_label` is the newer canonical column.

Some rows looked like this:

```text
pseudonym = Desk-47 Owl
author_label = Anonymous Student
```

That meant the useful label existed, but the app and database migration were not always using it correctly.

### Step 1: I checked the POST API

File:

```text
app/api/messages/route.ts
```

What I checked:

- The API reads `demoUserId`.
- The API calls the HMAC helper.
- The helper creates labels like `Desk-47 Echo`.
- The insert writes the generated label to both:
  - `author_label`
  - `pseudonym`

What I changed:

- The API response now returns a small debug-friendly message object with:
  - `id`
  - `location_id`
  - `body`
  - `pseudonym`
  - `author_label`
  - `created_at`

Why:

- When testing in the browser Network tab, a beginner can immediately see whether `author_label` and `pseudonym` match.

### Step 2: I added a display-label helper

File:

```text
lib/author-label.ts
```

What I added:

```text
getDisplayAuthorLabel(message)
```

How it decides what to show:

1. If `author_label` exists and is not `Anonymous Student`, show it.
2. Else, if `pseudonym` exists and is not `Anonymous Student`, show it.
3. Else, show `Anonymous Student`.

Why:

- `Anonymous Student` is a real string, so it is truthy in JavaScript.
- Code like `author_label || pseudonym` is wrong here because it stops at `Anonymous Student` and never reaches the better old `pseudonym`.

### Step 3: I used the helper when reading and rendering messages

Files:

```text
lib/messages.ts
app/desk/[locationId]/page.tsx
```

What I changed:

- `lib/messages.ts` normalizes fetched rows with `getDisplayAuthorLabel`.
- The message card in `page.tsx` also uses `getDisplayAuthorLabel`.

Why:

- The server data and visible UI now agree on the same fallback rule.
- Old rows render correctly before the database is fully backfilled.

### Step 4: I fixed the SQL backfill

Files:

```text
supabase/schema.sql
supabase/seed.sql
```

What was wrong before:

```sql
set author_label = coalesce(nullif(author_label, ''), nullif(pseudonym, ''), 'Anonymous Student')
```

Why that was wrong:

- `author_label` was `Anonymous Student`.
- `Anonymous Student` is not an empty string.
- So SQL kept `Anonymous Student` and never copied `pseudonym`.

Correct SQL:

```sql
update messages
set author_label = pseudonym
where author_label = 'Anonymous Student'
  and pseudonym is not null
  and pseudonym <> ''
  and pseudonym <> 'Anonymous Student';
```

What happens after:

- Rows with `pseudonym = Desk-47 Owl` get `author_label = Desk-47 Owl`.
- Rows where both columns are `Anonymous Student` are left unchanged.
- Those unchanged rows are old test data and can be manually deleted before the final demo.

### Step 5: I documented the migration

File:

```text
README.md
```

What I added:

- The exact backfill SQL.
- A simple explanation that `author_label` is canonical.
- A note that old all-anonymous test rows should not be deleted automatically.

### Step 6: I verified the fix locally

Commands:

```bash
npm run lint
npm run build
```

Result:

- Both passed.

Local dev check:

```text
http://127.0.0.1:3000/api/health
```

Result:

```json
{
  "ok": true,
  "checkpoint": "hours-2-7",
  "desk47Messages": {
    "source": "supabase",
    "count": 29
  }
}
```

POST test:

```text
body = Author label migration verification: canonical author_label should match pseudonym.
demoUserId = local-author-label-migration-check
```

Response:

```json
{
  "message": {
    "pseudonym": "Desk-47 Echo",
    "author_label": "Desk-47 Echo"
  }
}
```

Desk page check:

- `/desk/47` showed the new verification message.
- `/desk/47` showed `Desk-47 Echo`.
- `/desk/47` did not show `Desk QR`.
- `/desk/47` did not show `QR code`.
- `/desk/47` did not show `localhost`.

Supabase select check:

```sql
select id, location_id, pseudonym, author_label, body, created_at
from messages
where location_id = 47
order by created_at desc
limit 10;
```

Important result:

```text
Newest row:
pseudonym = Desk-47 Echo
author_label = Desk-47 Echo
```

Old test-data note:

```text
One older verification row still has:
pseudonym = Anonymous Student
author_label = Anonymous Student
```

That is old test data, not the main migration bug. Do not delete it automatically.

## Next Step

Only start onboarding after:

- the cleanup above is pushed
- Vercel has the required env vars
- deployed `/desk/47` passes the checks
