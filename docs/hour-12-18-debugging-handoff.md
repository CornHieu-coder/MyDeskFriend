# Hour 12-18 Debugging Handoff

This handoff explains the profile-based ranking checkpoint in beginner-friendly steps.

Hour 12-18 goal:

```text
same Desk 47
same messages
Alex profile -> COMP2521/MATH1081 messages near the top
Jamie profile -> FINS1613/ECON1101 messages near the top
```

## Current Result

Stage A deterministic ranking is implemented.

Stage A does not use OpenAI.

Stage A does not require pgvector.

That means the demo can show personalisation even if embeddings are not ready.

Stage B is now implemented as an optional upgrade layer.

If OpenAI, pgvector, and embedded rows are ready, the app can add semantic similarity.

If any Stage B piece is missing, the app falls back to Stage A ranking.

## How Ranking Works

The saved profile still comes from browser localStorage:

```text
mystudyfriend_profile
```

Example Alex profile:

```json
{
  "profileId": "alex",
  "displayName": "Alex",
  "courses": ["COMP2521", "MATH1081"]
}
```

When the archive opens:

1. The browser loads the saved profile.
2. The app passes the profile and messages into `rankMessages`.
3. `rankMessages` gives every message a score.
4. The messages are sorted from highest score to lowest score.
5. The top 3 messages show small reason labels.

## Ranking Context

The function `buildContextString(profile)` creates a readable context string.

For Alex it looks like:

```text
COMP2521, MATH1081, UNSW term week 10, exam period, late night study, COMP2521 final exam soon, recursion, data structures, MATH1081 graph proofs
```

For Jamie it looks like:

```text
FINS1613, ECON1101, UNSW term week 10, exam period, late night study, FINS1613 quiz soon, finance formulas, risk return, ECON1101 economics concepts
```

Why this exists:

- Stage A uses the profile courses for deterministic ranking.
- Stage B can later send this context string to the embeddings API.
- In development mode, this context appears in the small debug line.

## Scoring Formula

Each message gets these score parts:

```text
courseOverlap
tagRelevance
temporalRelevance
upvoteScore
agePenalty
semanticSimilarity
```

Stage A always sets:

```text
semanticSimilarity = 0
```

Final Stage A score:

```text
0.55 * courseOverlap
+ 0.20 * tagRelevance
+ 0.15 * temporalRelevance
+ 0.10 * upvoteScore
- 0.03 * agePenalty
```

Course overlap is the biggest weight on purpose.

That makes the demo clear:

- Alex gets COMP2521/MATH1081 content.
- Jamie gets FINS1613/ECON1101 content.

## Score Parts Explained

### courseOverlap

Value:

```text
1 or 0
```

If a message has a `course_tags` value that matches one of the profile courses, it gets 1.

Example:

```text
profile courses = COMP2521, MATH1081
message course_tags = COMP2521
courseOverlap = 1
```

Multiple course matches still cap at 1.

### tagRelevance

Current demo setting:

```text
examPeriod = true
```

Rules:

```text
exam advice -> 1
study tip -> 0.8
emotional support -> 0.7
otherwise -> 0
```

### temporalRelevance

Current demo week:

```text
currentWeek = 10
```

If a message has `term_week_when_written`, the score is:

```text
max(0, 1 - abs(10 - term_week_when_written) / 10)
```

So week 10 messages are most relevant.

If the message has no week, it gets:

```text
0.5
```

### upvoteScore

Upvotes use a soft cap so very popular messages help but do not dominate:

```text
min(Math.log1p(upvotes) / Math.log1p(20), 1)
```

### agePenalty

Older messages lose a tiny amount:

```text
min(daysOld / 365, 1)
```

Then the final formula subtracts:

```text
0.03 * agePenalty
```

This is small because old archive memories should still matter.

## Why Labels

The top 3 ranked messages show small labels.

Examples:

```text
Matched COMP2521 + exam advice
Relevant to week 10
Popular at this desk
```

Only the top 3 show these labels.

Why:

- The judge can see why the order changed.
- The UI does not become a debug table.

## Files Changed

### `lib/ranking.ts`

New file.

What it does:

- Defines the `StudyProfile` type.
- Defines `buildContextString(profile)`.
- Defines `rankMessages(messages, profile)`.
- Defines `getWhyThisMessage(message, profile, scoreParts)`.
- Calculates the deterministic Stage A score.
- Sorts messages by score descending.

Why it exists:

- Ranking should be reusable and easy to test.
- The archive component should not contain the scoring math.

What happens after:

- The same messages can be ranked differently for Alex and Jamie.

### `app/desk/[locationId]/desk-archive-client.tsx`

What changed:

- Imports `rankMessages`.
- Imports `buildContextString`.
- Imports the shared `StudyProfile` type.
- After the profile loads, the component ranks messages with:

```text
rankMessages(messages, profile)
```

- Renders ranked messages instead of newest-first messages.
- Shows reason labels for the first 3 ranked messages.
- Keeps the profile banner and Switch profile behavior.

Why:

- The profile is stored in localStorage, so ranking must happen after the browser profile is loaded.
- Switching from Alex to Jamie should rerank immediately.

What happens after:

- Alex and Jamie see different message ordering at the same desk.
- Posting still works because the composer is unchanged.
- After posting refreshes the page, the messages are ranked again for the current profile.

### `lib/demoData.ts`

What changed:

- Added more Desk 47 seed messages for:
  - MATH1081
  - ECON1101

Why:

- Desk 47 already had enough COMP2521 and FINS1613 messages.
- It only had one MATH1081 and one ECON1101 message.
- The demo is clearer when both Alex and Jamie have multiple relevant messages.

What happens after:

- Fallback/demo data can show visibly different top results for both profiles.

### `supabase/seed.sql`

What changed:

- Added the same MATH1081 and ECON1101 Desk 47 messages to the database seed.
- Kept the seed idempotent with stable UUIDs and `on conflict`.

Why:

- A fresh Supabase project should get enough ranked demo content.

What happens after:

- Running `supabase/seed.sql` adds the new ranking demo messages without duplicating them.

Important:

- If the live Supabase database was already seeded before this change, run `supabase/seed.sql` again.

### `app/api/health/route.ts`

What changed:

- The checkpoint now returns:

```text
hours-12-18
```

Why:

- `/api/health` should show the latest completed checkpoint.

### `README.md`

What changed:

- Added Hour 12-18 Stage A status.
- Updated seed count from 24 Desk 47 messages to 28 Desk 47 messages.
- Added `lib/ranking.ts` to the file map.
- Added this handoff to the docs list.

Why:

- Future teammates should know Stage A is the safe fallback and Stage B is optional.

## Stage B Status

Stage B is implemented, but it is not required for the live demo.

Built:

```text
pgvector embedding column
lib/openai.ts
admin embed endpoint
match_messages_for_location RPC
POST /api/ranked-messages
embedding-based scoring
```

How it behaves:

- `/api/ranked-messages` always returns a ranked list.
- If `OPENAI_API_KEY` is missing, it returns Stage A ranking.
- If pgvector SQL has not been run, it returns Stage A ranking.
- If no messages have embeddings yet, it returns Stage A ranking.
- If embedded messages exist, it adds semantic similarity and uses the Stage B score.

Stage B needs these environment variables:

```text
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_SECRET
```

`OPENAI_API_KEY` creates embeddings.

`SUPABASE_SERVICE_ROLE_KEY` lets the admin endpoint update the protected `messages.embedding` column.

`ADMIN_SECRET` protects the embedding route in production.

Important local env rule:

```text
Run app from DeskSupport -> Next.js reads DeskSupport/.env.local
```

If the keys are only in the parent `Hackathon/.env.local`, the app will not see them.

What happens then:

- `/api/debug/env-check` returns false for the Stage B keys.
- `/api/ranked-messages` correctly stays in Stage A.
- `/api/admin/embed-messages` correctly says the service role key is missing.

Fix:

1. Put the three Stage B keys in `DeskSupport/.env.local`.
2. Restart the dev server.
3. Do not commit `.env.local`.

## Stage B Files Changed

### `supabase/schema.sql`

What changed:

- Enables pgvector:

```sql
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
```

- Adds the embedding column:

```sql
alter table public.messages
  add column if not exists embedding extensions.vector(1536);
```

- Adds the similarity RPC:

```text
match_messages_for_location(query_embedding, target_location_id, match_count)
```

Why:

- The database needs a place to store message embeddings.
- The RPC lets Supabase compare a profile context embedding against stored message embeddings.

What happens after:

- Messages can be ranked by semantic similarity if embeddings exist.
- If the SQL has not been run yet, the app still falls back to Stage A.

### `lib/openai.ts`

What changed:

- Added `embedText(text)`.
- Uses:

```text
text-embedding-3-small
```

Why:

- This converts message text or profile context text into a vector.
- OpenAI calls must stay server-side because `OPENAI_API_KEY` is secret.

What happens after:

- Server routes can create embeddings.
- Browser components never call OpenAI directly.

### `lib/vector.ts`

What changed:

- Added `toVectorLiteral(values)`.
- It now rejects empty arrays.
- It now rejects `NaN`, `Infinity`, and `undefined` values.

Why:

- Supabase/Postgres accepts pgvector values as a text-like literal:

```text
[0.1,0.2,0.3]
```

What happens after:

- OpenAI embedding arrays can be saved into `messages.embedding`.
- Bad embedding arrays fail early instead of writing broken vector data.

### `app/api/admin/embed-messages/route.ts`

What changed:

- New developer-only endpoint.
- `GET` returns total public messages, missing embeddings, and embedded messages.
- `POST` embeds a batch of missing messages.
- Default batch size is 10.
- Maximum batch size is 20.
- Responses include safe env presence booleans:

```json
{
  "hasOpenAIKey": true,
  "hasServiceRoleKey": true,
  "hasAdminSecret": true
}
```

These are only true/false values. They never print secret keys.

Protection:

- If `ADMIN_SECRET` exists, requests must send:

```text
x-admin-secret: your-admin-secret
```

- In production, `ADMIN_SECRET` is required.
- Updating embeddings requires `SUPABASE_SERVICE_ROLE_KEY`.

Why:

- Embedding all messages should not happen from the public student page.
- This gives developers a controlled way to prepare the demo data.

What happens after:

- Run `POST /api/admin/embed-messages` repeatedly until `missingEmbeddings` is 0.
- If schema is missing, the route tells you to run `supabase/schema.sql`.

### `app/api/ranked-messages/route.ts`

What changed:

- New API route.
- Request:

```json
{
  "locationId": 47,
  "profile": {
    "profileId": "alex",
    "displayName": "Alex",
    "courses": ["COMP2521", "MATH1081"]
  }
}
```

- Response includes:

```text
contextString
mode
messages
score
why
```

Fallback warnings are now specific:

```text
OPENAI_API_KEY is missing, so deterministic ranking was used.
Vector search is not ready; deterministic ranking was used.
No embedded messages found; deterministic ranking was used.
Embedding ranking failed; deterministic ranking was used. ...
```

Why:

- The warning should say the real reason Stage B did not run.
- If the OpenAI key exists, the API should not keep showing an old missing-key warning.

Mode values:

```text
stage-a
stage-b
```

Why:

- The profile is stored in localStorage, so the browser sends it to the server.
- The server can then use OpenAI safely if available.

What happens after:

- If embeddings work, `mode` becomes `stage-b`.
- If anything fails, `mode` stays `stage-a` and the archive still works.

### `app/api/debug/env-check/route.ts`

What changed:

- New development-only debug endpoint.
- Local URL:

```text
/api/debug/env-check
```

- It returns:

```json
{
  "hasOpenAIKey": true,
  "hasServiceRoleKey": true,
  "hasAdminSecret": true
}
```

Why:

- It helps confirm whether Next.js actually loaded the local Stage B env vars.
- It returns booleans only, not secret values.

What happens after:

- In development, use it before testing embeddings.
- In production, it returns 404.

### `app/desk/[locationId]/desk-archive-client.tsx`

What changed:

- Still computes local Stage A ranking immediately.
- Also calls `POST /api/ranked-messages` after the profile loads.
- If the API returns successfully, the page uses the API-ranked messages.
- If the API fails, the page keeps the local Stage A ranking.

Why:

- The UI should never be blocked by embeddings.
- Profile switching should still feel instant.

What happens after:

- Stage A works immediately.
- Stage B silently improves ranking when available.

### `lib/ranking.ts`

What changed:

- Messages can now include `semantic_similarity`.
- If `semantic_similarity` exists, the Stage B formula is used:

```text
0.40 * semanticSimilarity
+ 0.35 * courseOverlap
+ 0.10 * tagRelevance
+ 0.10 * temporalRelevance
+ 0.05 * upvoteScore
- 0.03 * agePenalty
```

- If `semantic_similarity` is missing, the Stage A formula is still used.

Why:

- This keeps the deterministic demo path while allowing embeddings to improve the order.

What happens after:

- Embedded messages can be ranked by both semantic meaning and course tags.

## Verification Performed

Commands:

```bash
npm run lint
npm run build
```

Result:

- Both passed.

## Latest Semantic Chip Bug Fix

Date:

```text
May 20, 2026
```

Problem:

Some cards showed both:

```text
Medium semantic match
Strong semantic match
```

That should never happen.

Root cause:

- `lib/ranking.ts` could add a fixed-threshold semantic chip.
- `app/desk/[locationId]/desk-archive-client.tsx` could add a relative semantic chip.
- A message could therefore receive one semantic label from the API and another semantic label from the UI.

Fix:

- `lib/ranking.ts` no longer adds semantic chips inside the base ranker.
- `app/api/ranked-messages/route.ts` now adds exactly one relative semantic chip per ranked response.
- `desk-archive-client.tsx` now only filters and displays the chips it receives.
- A defensive cleanup removes `Medium semantic match` if `Strong semantic match` is present.

Important:

- The ranking formula did not change.
- Stage B still works.
- Stage A fallback still works.
- Raw score/debug JSON is not shown in the UI.

Verification:

```json
{
  "mode": "stage-b",
  "semanticSimilarity": 0.90076467219081,
  "apiWhy": [
    "Matched COMP2521",
    "Exam advice",
    "Relevant to week 10",
    "Medium semantic match"
  ],
  "apiHasBoth": false,
  "uiHasBoth": false,
  "hasRawDebug": false
}
```

Regression checks:

```json
{
  "apiHealthWorks": true,
  "hasQrCode": false,
  "hasLocalhostUrl": false,
  "postingStillWorks": true,
  "authorLabelExample": "Desk-47 Fox"
}
```

Commands:

```bash
npm run lint
npm run build
```

Result:

- `npm run lint` passed with one existing warning about `<img>` in `app/home-content.tsx`.
- `npm run build` passed.

## Latest Semantic Threshold Fix

Date:

```text
May 20, 2026
```

Problem:

- A message could lose `Strong semantic match` when a newer message had a higher semantic score.
- This happened because semantic chips were based on relative percentiles.
- That made the label feel like a winner-takes-all badge.

What changed:

File:

```text
lib/ranking.ts
```

Semantic chips now use fixed per-message thresholds:

```text
Strong semantic match >= 0.50
Medium semantic match >= 0.43
No semantic chip < 0.43
```

Why:

- Our local embedding scores cluster around `0.50-0.55`.
- Absolute thresholds are easier to understand in the demo.
- Multiple messages can now show `Strong semantic match` at the same time.

File:

```text
app/api/ranked-messages/route.ts
```

What changed:

- Removed relative/percentile semantic threshold logic.
- The API now adds semantic chips using fixed thresholds.
- Chip priority is:

```text
1. Matched course
2. Strong/Medium semantic match
3. Exam advice / Study tip / Emotional support
4. Relevant to week 10
5. Popular at this desk
```

Defensive rule:

```text
If Strong semantic match exists, remove Medium semantic match.
```

File:

```text
app/desk/[locationId]/desk-archive-client.tsx
```

What changed:

- Top 3 cards can show up to 5 chips.
- The UI still removes duplicate chips.
- The UI still prevents one card from showing both `Medium semantic match` and `Strong semantic match`.

Extra fix:

File:

```text
lib/messages.ts
```

What changed:

- The message fetch limit increased from 50 to 150.

Why:

- The live database had enough test posts that older FINS1613/ECON1101 seed messages fell outside the latest 50 rows.
- Jamie ranking looked wrong because the ranker never saw the Jamie-relevant candidate messages.

Verification:

Alex API result:

```json
{
  "mode": "stage-b",
  "strongCount": 6,
  "mediumCount": 4,
  "violations": []
}
```

Meaning:

- Every message with `semantic_similarity >= 0.50` had `Strong semantic match`.
- Every message with `0.43 <= semantic_similarity < 0.50` had `Medium semantic match`.
- No message had both semantic labels.

Jamie API result:

```json
{
  "mode": "stage-b",
  "topMessageCourseTags": "FINS1613,ECON1101",
  "topWhy": "Matched FINS1613 | Strong semantic match | Exam advice | Relevant to week 10"
}
```

Browser smoke test:

```json
{
  "mode": "stage-b",
  "strongCount": 5,
  "cardsWithBoth": 0,
  "hasRawDebug": false,
  "hasQrText": false
}
```

Posting regression:

```json
{
  "author_label": "Desk-47 Fox",
  "tags": "exam advice,study tip",
  "course_tags": "COMP2521",
  "term_week_when_written": 10
}
```

Commands:

```bash
npm run lint
npm run build
```

Result:

- `npm run lint` passed with one existing warning about `<img>` in `app/home-content.tsx`.
- `npm run build` passed.

Health check:

```text
GET /api/health
```

Important result:

```json
{
  "ok": true,
  "checkpoint": "hours-12-18",
  "desk47Messages": {
    "source": "supabase",
    "count": 35
  }
}
```

Server HTML check:

```json
{
  "HasCheckingProfile": true,
  "HasServerRenderedArchive": false,
  "HasDeskQr": false,
  "HasQrCode": false,
  "HasLocalhost": false
}
```

What this means:

- The server still renders the safe profile-checking state first.
- The archive waits for the browser profile.
- The QR/debug URL cleanup stayed intact.

Ranking check:

I ran a local TypeScript ranking check against the fallback Desk 47 messages.

Alex top 3:

```text
1. COMP2521 AVL rotations...
   Matched COMP2521 + exam advice
2. COMP2521 recursion...
   Matched COMP2521 + exam advice
3. MATH1081 graph proofs...
   Matched MATH1081 + exam advice
```

Jamie top 3:

```text
1. ECON1101 elasticity...
   Matched ECON1101 + exam advice
2. FINS1613 explain why the answer moves...
   Matched FINS1613 + exam advice
3. ECON1101 graphs...
   Matched ECON1101 + study tip
```

This confirms:

- Alex and Jamie get different orderings.
- The top 3 messages have why labels.
- The ranking is course-sensitive.

Local env placement check:

```text
DeskSupport/.env.local
```

Stage B keys currently visible there:

```json
{
  "hasOpenAIKey": false,
  "hasServiceRoleKey": false,
  "hasAdminSecret": false
}
```

Parent env file check:

```text
Hackathon/.env.local
```

Stage B keys visible there:

```json
{
  "hasOpenAIKey": true,
  "hasServiceRoleKey": true,
  "hasAdminSecret": true
}
```

What this means:

- The user did add the Stage B keys.
- They were added to the parent env file.
- The Next.js app will not load them from there when running inside `DeskSupport`.
- Copy the three Stage B keys into `DeskSupport/.env.local`, then restart `npm run dev`.

Development env endpoint check:

```text
GET /api/debug/env-check
```

Important response fields:

```json
{
  "hasOpenAIKey": false,
  "hasServiceRoleKey": false,
  "hasAdminSecret": false
}
```

What this means:

- The endpoint works.
- The running local app still cannot see the Stage B env vars from `DeskSupport/.env.local`.
- This is why normal local Stage B still falls back to Stage A.

Ranked API check with the current `DeskSupport/.env.local`:

```text
POST /api/ranked-messages
```

Request used Alex profile.

Important response fields:

```json
{
  "mode": "stage-a",
  "source": "supabase",
  "warning": "OPENAI_API_KEY is missing, so deterministic ranking was used."
}
```

What this means:

- The ranked API works.
- The warning is accurate because the app-local env file does not have `OPENAI_API_KEY`.
- The response still includes `contextString`, ranked `messages`, `score`, and `why`.

Admin embedding endpoint check with the current `DeskSupport/.env.local`:

```json
{
  "status": 503,
  "error": "SUPABASE_SERVICE_ROLE_KEY is required to update message embeddings.",
  "env": {
    "hasOpenAIKey": false,
    "hasServiceRoleKey": false,
    "hasAdminSecret": false
  }
}
```

What this means:

- The route exists.
- It does not try to update embeddings without the service role key.
- The response now includes safe boolean diagnostics.

Temporary Stage B env test:

I started a temporary production server with the parent env values inherited only by that process.

This did not write secrets into the repo.

Admin GET result:

```json
{
  "totalPublicMessages": 35,
  "missingEmbeddings": 35,
  "embeddedMessages": 0,
  "env": {
    "hasOpenAIKey": true,
    "hasServiceRoleKey": true,
    "hasAdminSecret": true
  }
}
```

Admin POST result with `limit: 1`:

```json
{
  "requested": 1,
  "embeddedCount": 0,
  "missingEmbeddings": 35,
  "embeddedMessages": 0,
  "failedCount": 1,
  "firstFailure": "OpenAI quota or billing is unavailable."
}
```

Ranked API result with Stage B env values present:

```json
{
  "mode": "stage-a",
  "warning": "Embedding ranking failed; deterministic ranking was used. OpenAI quota or billing is unavailable.",
  "firstMessageSemanticSimilarity": null
}
```

What this means:

- The Stage B env names are correct.
- The admin route accepts the correct `x-admin-secret` header.
- The service role key can read the public message count.
- OpenAI currently cannot create embeddings because the API key/account returned a quota or billing error.
- The fallback warning is now accurate and no longer says the OpenAI key is missing when the key is present.
- No embeddings were created during this test.

## Manual Browser Checklist

Do this in the browser:

1. Clear localStorage.
2. Open `/desk/47`.
3. Select Alex.
4. Confirm the top messages mention COMP2521 or MATH1081.
5. Confirm the top 3 show why labels.
6. Click `Switch profile`.
7. Select Jamie.
8. Confirm the top messages change.
9. Confirm the top messages mention FINS1613 or ECON1101.
10. Post a safe message.
11. Confirm the message posts with a stable anonymous label.

## Debugging

### Messages do not reorder after switching profile

Check:

1. Open browser console.
2. Run:

```js
localStorage.getItem("mystudyfriend_profile")
```

3. Confirm the saved profile courses changed.
4. Confirm `Switch profile` was followed by `Enter archive`.

### Top messages are not course-specific

Check the message data:

```sql
select id, body, course_tags, tags, upvotes, term_week_when_written
from messages
where location_id = 47
order by created_at desc;
```

There should be messages tagged with:

```text
COMP2521
MATH1081
FINS1613
ECON1101
```

If MATH1081 or ECON1101 rows are missing, rerun:

```text
supabase/seed.sql
```

### Why labels do not appear

Expected:

- Only top 3 messages show why labels.
- Lower messages do not show why labels.

If no labels appear at all, check that the component is rendering `rankedMessages`, not raw `messages`.

### Posted message appears lower than expected

This can be normal.

New posts usually have no `course_tags`, no upvotes, and no term week, so they may not outrank seeded course-specific messages.

The post is still saved correctly if:

- the API returns HTTP 201
- the message appears after refresh
- the message has `author_label`

## Stage B Setup Checklist

To activate embeddings locally:

1. Add these to `DeskSupport/.env.local`:

```text
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_SECRET
```

2. Restart the dev server.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Verify pgvector:

```sql
select extname from pg_extension where extname = 'vector';
```

5. Verify the embedding column:

```sql
select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'messages'
  and column_name = 'embedding';
```

6. Verify the RPC:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'match_messages_for_location';
```

7. Check local env booleans:

```text
GET /api/debug/env-check
```

8. Call `GET /api/admin/embed-messages` with `x-admin-secret`.
9. Call `POST /api/admin/embed-messages` with `x-admin-secret`.
10. Repeat until missing embeddings are 0.
11. Call `POST /api/ranked-messages`.
12. Confirm the response has:

```text
mode = stage-b
```

If any step fails, continue using Stage A. The student-facing archive still works.

To activate embeddings on Vercel:

1. Add `OPENAI_API_KEY` to Vercel.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.
3. Add `ADMIN_SECRET` to Vercel.
4. Redeploy.
5. Use the same admin endpoint flow above.

## Latest Stage B Re-check

Date:

```text
May 19, 2026
```

Reason for this re-check:

- The Stage B keys were moved into `DeskSupport/.env.local`.
- OpenAI API credit was added.
- We needed to prove local Stage B works end to end.

### Env Loading Result

Confirmed app root:

```text
C:\Users\Admin\OneDrive\Máy tính\Hackathon\DeskSupport
```

Confirmed env file:

```text
DeskSupport/.env.local
```

The dev server was restarted.

Then this endpoint was called:

```text
GET /api/debug/env-check
```

Result:

```json
{
  "hasOpenAIKey": true,
  "hasServiceRoleKey": true,
  "hasAdminSecret": true
}
```

What this means:

- Next.js is now loading the correct local env file.
- Stage B can access OpenAI, Supabase service role, and the admin secret.
- No secret values were printed.

### Admin Endpoint Result

First, the admin endpoint was called without the secret header.

Result:

```json
{
  "status": 401,
  "error": "x-admin-secret header is missing or invalid."
}
```

What this means:

- The admin route is protected.

Then it was called with the correct `x-admin-secret` header.

Initial result:

```json
{
  "ok": true,
  "totalPublicMessages": 37,
  "missingEmbeddings": 37,
  "embeddedMessages": 0,
  "env": {
    "hasOpenAIKey": true,
    "hasServiceRoleKey": true,
    "hasAdminSecret": true
  }
}
```

What this means:

- The service role key works.
- The live Supabase `messages.embedding` column is reachable.
- The database had public messages but no embeddings yet.

### Embedding Result

First test:

```text
POST /api/admin/embed-messages
body: {"batchSize":1}
```

Result:

```json
{
  "ok": true,
  "requested": 1,
  "embeddedCount": 1,
  "missingEmbeddings": 36,
  "embeddedMessages": 1
}
```

What this means:

- OpenAI embeddings now work locally.
- Supabase can save embeddings.
- The previous quota/billing blocker is gone.

Then the rest were embedded safely in batches of 10.

Batch results:

```json
[
  {
    "batch": 1,
    "embeddedCount": 10,
    "missingEmbeddings": 26,
    "embeddedMessages": 11
  },
  {
    "batch": 2,
    "embeddedCount": 10,
    "missingEmbeddings": 16,
    "embeddedMessages": 21
  },
  {
    "batch": 3,
    "embeddedCount": 10,
    "missingEmbeddings": 6,
    "embeddedMessages": 31
  },
  {
    "batch": 4,
    "embeddedCount": 6,
    "missingEmbeddings": 0,
    "embeddedMessages": 37
  }
]
```

After posting one regression-test message, that new message was embedded too.

Final admin count:

```json
{
  "totalPublicMessages": 38,
  "missingEmbeddings": 0,
  "embeddedMessages": 38
}
```

### Desk 47 Embedding Count

Supabase REST count for Desk 47:

```json
{
  "total": 38,
  "withEmbedding": 38,
  "publicTotal": 38,
  "publicWithEmbedding": 38
}
```

What this means:

- Every current public Desk 47 message has an embedding.
- The SQL equivalent to verify this manually is:

```sql
select
  count(*) as total,
  count(embedding) as with_embedding
from messages
where location_id = 47;
```

### Ranked API Result

Alex request:

```json
{
  "locationId": 47,
  "profile": {
    "profileId": "alex",
    "displayName": "Alex",
    "courses": ["COMP2521", "MATH1081"]
  }
}
```

Alex result:

```json
{
  "mode": "stage-b",
  "warning": null,
  "topMessages": [
    "For COMP2521 complexity, say what n represents before writing Big O...",
    "If COMP2521 recursion feels impossible tonight...",
    "COMP2521 graphs: say out loud what the queue or stack contains..."
  ]
}
```

Jamie request:

```json
{
  "locationId": 47,
  "profile": {
    "profileId": "jamie",
    "displayName": "Jamie",
    "courses": ["FINS1613", "ECON1101"]
  }
}
```

Jamie result:

```json
{
  "mode": "stage-b",
  "warning": null,
  "topMessages": [
    "For FINS1613, write the formula sheet from memory first...",
    "FINS1613: make sure you can explain why the answer moves...",
    "For FINS1613, explain ratios in plain English..."
  ]
}
```

What this means:

- Stage B is active locally.
- The same Desk 47 messages reorder differently for Alex and Jamie.
- Responses include `contextString`, `score`, `why`, and `semantic_similarity`.
- Stage A fallback is still present if Stage B fails later.

### Browser UI Result

A temporary Playwright smoke test was run and then removed.

Result:

```json
{
  "alexMode": "stage-b",
  "jamieMode": "stage-b",
  "alexTopHasExpectedCourse": true,
  "jamieTopHasExpectedCourse": true,
  "topCardsDiffer": true,
  "hasWhyLabel": true,
  "hasQrText": false
}
```

What this means:

- Clearing localStorage shows onboarding.
- Choosing Alex opens the archive.
- The browser calls `POST /api/ranked-messages`.
- Alex gets Stage B ranking.
- Switching to Jamie reranks the archive.
- Jamie gets Stage B ranking.
- Why labels still show.
- The Desk 47 page still does not show QR/debug URL content.

### Posting Regression Result

Posted one safe verification message through:

```text
POST /api/messages
```

Result:

```json
{
  "status": "created",
  "author_label": "Desk-47 Koala",
  "pseudonym": "Desk-47 Koala"
}
```

What this means:

- Posting still works.
- Anonymous per-desk labels still work.
- The new message was embedded afterward so Stage B remains complete.

### Final Regression Result

Commands:

```bash
npm run lint
npm run build
```

Result:

- Both passed.

Other checks:

```json
{
  "apiHealthWorks": true,
  "desk47HasQr": false,
  "desk47HasQrImage": false,
  "desk47HasLocalhostUrl": false,
  "stageBActive": true,
  "stageAFallbackStillAvailable": true
}
```

Current conclusion:

```text
Stage B embedding ranking is active locally.
```

## Latest Why-Chip UI Update

Date:

```text
May 19, 2026
```

Goal:

- Make the message-card reasons easier for a judge to read.
- Keep the UI student-friendly.
- Do not show raw scores or raw JSON.

### What Changed

File:

```text
lib/ranking.ts
```

What changed:

- Reason labels are now split into clean chips.
- Old style:

```text
Matched COMP2521 + exam advice
```

- New style:

```text
Matched COMP2521
Exam advice
Relevant to week 10
Popular at this desk
```

Why:

- A human can understand separate short chips faster than a combined technical sentence.
- It avoids duplicate labels on the card.

Semantic helper added:

```text
getSemanticMatchLabel(semanticSimilarity)
```

Behavior:

```text
>= 0.78 -> Strong semantic match
>= 0.62 -> Medium semantic match
< 0.62 -> no semantic chip
missing -> no semantic chip
```

File:

```text
app/desk/[locationId]/desk-archive-client.tsx
```

What changed:

- Message cards now decide how many reason chips to show by rank.
- Top 3 messages show up to 4 chips.
- Messages ranked 4-8 show only concise useful chips, such as matched course or semantic match.
- Messages below rank 8 hide reason chips unless they have a very clean strong semantic + course match.
- Stage A still only shows top-3 non-semantic reason chips.
- Stage B shows a small student-facing line:

```text
Ranked by course fit, semantic similarity, timing, and desk activity.
```

Why:

- Judges can see ranking is personalised.
- The page does not become a developer dashboard.
- The line does not imply semantic similarity is the only ranking signal.

### Current Semantic-Chip Data Note

The semantic chip thresholds were implemented exactly as requested.

Current local Stage B similarities are below the medium threshold.

Examples:

```json
{
  "alexTopSimilarity": 0.519710142408031,
  "jamieTopSimilarity": 0.533061257596668,
  "mediumThreshold": 0.62,
  "strongThreshold": 0.78
}
```

What this means:

- Stage B is active.
- The UI supports semantic chips.
- The current seeded/live messages do not show `Medium semantic match` or `Strong semantic match` yet because none of the current similarities reach `0.62`.
- To force visible semantic chips for the final demo, either add very close seed messages or lower the semantic-chip thresholds.
- The ranking itself still uses semantic similarity in the combined Stage B score.

### Verification After Why-Chip Update

Commands:

```bash
npm run lint
npm run build
```

Result:

- Both passed.

API checks:

```json
{
  "alexMode": "stage-b",
  "alexTopWhy": "Matched COMP2521 | Exam advice | Relevant to week 10 | Popular at this desk",
  "jamieMode": "stage-b",
  "jamieTopWhy": "Matched FINS1613 | Study tip | Popular at this desk"
}
```

QR cleanup regression:

```json
{
  "HasDeskQr": false,
  "HasQrCode": false,
  "HasLocalhost": false
}
```

## Latest Message Enrichment Fix

Date:

```text
May 19, 2026
```

Problem:

A new Alex-targeted message sounded very relevant:

```text
COMP2521, MATH1081, UNSW term week 10, exam period, late night study...
```

But it was ranked near the bottom.

### Why It Ranked Low

The latest Desk 47 rows were checked.

The two Alex-targeted rows had:

```json
{
  "tags": [],
  "course_tags": [],
  "upvotes": 0,
  "term_week_when_written": null,
  "hasEmbedding": false
}
```

In Alex ranking, they were:

```json
[
  {
    "rank": 38,
    "score": 0.0749998327730213,
    "semantic_similarity": null,
    "why": "For COMP2521 study context"
  },
  {
    "rank": 39,
    "score": 0.07499966226788432,
    "semantic_similarity": null,
    "why": "For COMP2521 study context"
  }
]
```

Simple explanation:

- The words looked relevant to a human.
- But the database row did not store course tags.
- It did not store message tags.
- It did not store week 10.
- It did not have an embedding yet.
- So the ranker had almost no useful signals.

### Code Fix

File:

```text
lib/message-enrichment.ts
```

New helper:

```text
enrichMessageBody(body)
```

What it does:

- Finds supported course codes in the message body:

```text
COMP1511
COMP2521
COMP1531
MATH1081
FINS1613
ECON1101
```

- Saves detected codes into `course_tags`.
- Adds `exam advice` if the body mentions exam/final/quiz/test.
- Adds `study tip` if the body mentions tip/practise/practice/write/draw/explain.
- Adds `emotional support` if the body mentions tired/stress/stressed/stressful/overwhelming/hard.
- Sets `term_week_when_written` to demo week 10.

Why:

- New user posts need the same ranking signals as seeded demo messages.
- Otherwise course-specific messages can be buried unfairly.

File:

```text
app/api/messages/route.ts
```

What changed:

- `POST /api/messages` now enriches the body before inserting.
- It saves:

```text
tags
course_tags
term_week_when_written
```

- It still saves:

```text
author_label
pseudonym
status = public
```

- If `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are available, it embeds the new message immediately after insert.
- If embedding fails, the post still succeeds.
- The route logs only a safe warning, not secret values or raw key data.

Why:

- Posting should stay fast and reliable.
- Embeddings are useful, but a failed embedding should not block a student note.

File:

```text
app/api/ranked-messages/route.ts
```

What changed:

- In development mode only, each ranked message now includes:

```json
{
  "debugRanking": {
    "rank": 1,
    "finalScore": 0.9039,
    "scoreParts": {
      "courseOverlap": 1,
      "tagRelevance": 1,
      "temporalRelevance": 1,
      "upvoteScore": 0,
      "agePenalty": 0.000001,
      "semanticSimilarity": 0.8847
    }
  }
}
```

Why:

- A developer can inspect score parts in the Network tab.
- The normal UI still does not show raw scores or JSON.

File:

```text
app/desk/[locationId]/desk-archive-client.tsx
```

What changed:

- Semantic match chips now use relative thresholds per ranked response.
- Top 20 percent of semantic similarities get:

```text
Strong semantic match
```

- Top 50 percent get:

```text
Medium semantic match
```

Why:

- Embedding similarity scores are model- and dataset-dependent.
- In this dataset they clustered around `0.52`.
- Fixed thresholds like `0.78` made semantic chips almost never appear.
- Relative thresholds make the labels visible without changing the actual ranking formula.

Important:

- The ranking formula did not change.
- Stage B still uses:

```text
semantic similarity
course overlap
tag relevance
week relevance
upvotes
age penalty
```

### Existing Data Repair

The two already-posted Alex-targeted rows were repaired manually:

```json
{
  "tags": ["exam advice", "study tip"],
  "course_tags": ["COMP2521", "MATH1081"],
  "term_week_when_written": 10
}
```

Then the admin embedding endpoint embedded them.

Result:

```json
{
  "embeddedCount": 2,
  "missingEmbeddings": 0,
  "embeddedMessages": 41
}
```

### Verification

A fresh Alex-targeted post was created through `POST /api/messages`.

Response:

```json
{
  "author_label": "Desk-47 Wombat",
  "pseudonym": "Desk-47 Wombat",
  "tags": ["exam advice", "study tip", "emotional support"],
  "course_tags": ["COMP2521", "MATH1081"],
  "upvotes": 0,
  "term_week_when_written": 10
}
```

Database check:

```json
{
  "hasEmbedding": true,
  "course_tags": "COMP2521,MATH1081",
  "tags": "exam advice,study tip,emotional support",
  "term_week_when_written": 10
}
```

Alex result:

```json
{
  "rank": 1,
  "mode": "stage-b",
  "score": 0.9039194650310238,
  "semantic_similarity": 0.884798751045501,
  "why": "Matched COMP2521 | Strong semantic match | Exam advice | Relevant to week 10",
  "scoreParts": {
    "courseOverlap": 1,
    "tagRelevance": 1,
    "temporalRelevance": 1,
    "upvoteScore": 0,
    "semanticSimilarity": 0.884798751045501
  }
}
```

Jamie result for that same Alex-specific message:

```json
{
  "rank": 8,
  "mode": "stage-b",
  "score": 0.46277536142902803,
  "semantic_similarity": 0.656938729129077,
  "why": "Medium semantic match | Exam advice | Relevant to week 10"
}
```

What this means:

- The same message ranks high for Alex.
- The same message drops below Jamie-relevant messages for Jamie.
- This is the intended personalized behavior.

Browser smoke test result:

```json
{
  "alexTopHasExpectedCourse": true,
  "jamieTopHasExpectedCourse": true,
  "topCardsDiffer": true,
  "hasRawJsonOrDebugTable": false,
  "hasQrText": false
}
```

Final commands:

```bash
npm run lint
npm run build
```

Result:

- Both passed.

## Next Step

Continue to Hours 18-22 live presence after:

- Stage A ranking works on deployed `/desk/47`
- the ranked-messages API returns Stage A or Stage B successfully
- message posting still works

Do not block the hackathon demo on embeddings.

## Update: Semantic Match Chip Calibration

Problem found:

- Stage B was working, but the old semantic chip thresholds made Medium labels hard to see.
- The UI also hid semantic chips too aggressively on lower-ranked cards.
- The ranking API already used exclusive logic, so the same card cannot correctly show both `Strong semantic match` and `Medium semantic match`.

Code changes:

- In `lib/ranking.ts`, semantic chip thresholds are now:

```ts
strong: 0.52
medium: 0.46
```

Why:

- Desk 47 embedding similarities cluster around the low `0.50` range.
- These numbers are calibrated for the current hackathon demo dataset.
- The label is still per message, not winner-takes-all. Multiple messages can show Strong at the same time.

Display changes:

- Top 3 messages show up to 5 chips.
- Messages ranked 4-10 keep useful limited chips, including Medium or Strong semantic chips.
- Lower messages can still show semantic chips when the card also matches a selected course.
- A cleanup guard removes `Medium semantic match` whenever `Strong semantic match` is present on the same message.

Seed data changes:

- Added 6 medium-strength Desk 47 seed messages to `supabase/seed.sql`.
- Alex medium-target rows:
  - COMP2521 tracing a tiny input
  - MATH1081 definitions in plain English
  - algorithms question: idea before implementation
- Jamie medium-target rows:
  - FINS1613 variable meanings before formulas
  - ECON1101 graph story before equilibrium
  - finance quiz intuition before numbers

Live local Supabase update:

- The 6 new seed rows were upserted into Supabase with stable IDs.
- The admin embedding endpoint embedded all missing public messages.

Embedding result:

```json
{
  "beforeMissingEmbeddings": 51,
  "afterMissingEmbeddings": 0,
  "totalPublicMessages": 104
}
```

API verification after calibration:

Alex:

```json
{
  "mode": "stage-b",
  "warning": null,
  "totalMessages": 104,
  "semanticCount": 50,
  "minSemantic": 0.2594,
  "maxSemantic": 1,
  "strongCount": 4,
  "mediumCount": 6,
  "bothMediumAndStrongCount": 0
}
```

Alex examples:

- Strong: `COMP2521, MATH1081, UNSW term week 10...`
- Strong: `COMP2521 and MATH1081 week 10 exam grind...`
- Medium: `For COMP2521 complexity, say what n represents before writing Big O...`
- Medium: `If COMP2521 recursion feels impossible tonight...`

Jamie:

```json
{
  "mode": "stage-b",
  "warning": null,
  "totalMessages": 104,
  "semanticCount": 50,
  "minSemantic": 0.2438,
  "maxSemantic": 0.8678,
  "strongCount": 5,
  "mediumCount": 4,
  "bothMediumAndStrongCount": 0
}
```

Jamie examples:

- Strong: `FINS1613 and ECON1101 week 10 exam period...`
- Strong: `For FINS1613, write the formula sheet from memory first...`
- Medium: `For FINS1613, write the meaning of every variable...`
- Medium: `For FINS1613, explain ratios in plain English...`

Beginner debugging note:

- If Medium disappears again, first check the response from `POST /api/ranked-messages`.
- If the API contains Medium but the page does not show it, the bug is in `desk-archive-client.tsx` chip filtering.
- If the API does not contain Medium, check `lib/ranking.ts` thresholds and whether the messages have embeddings.
- If `mode` is `stage-a`, semantic chips are expected to be hidden because Stage A has no embedding similarity.
