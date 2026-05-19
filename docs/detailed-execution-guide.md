# Detailed Execution Guide

This file stores the full execution guide for future reference.

Use it as the project roadmap. Start from the earliest incomplete checkpoint. Do not skip ahead to later features until the current checkpoint works on the deployed site.

## Product Spine

The core demo flow is:

```text
scan a desk QR
-> place archive
-> course onboarding
-> personalised ranked messages
-> live presence
-> moderated anonymous posting
```

Protect this spine before adding extra features.

## Hours 0-2 - Freeze Scope + Infrastructure

Goal:

Create the project skeleton and prove that the deployed app can talk to Supabase.

Why this matters:

Infrastructure failures are the easiest way to lose a hackathon. Deploying early exposes missing env vars, broken build settings, and database connection issues while there is still time to fix them.

Implementation steps:

1. Create GitHub repo and Next.js app with TypeScript, Tailwind, and App Router.
2. Install core packages: `@supabase/supabase-js`, `openai`, and any UI helpers already agreed by the team.
3. Create Supabase project.
4. Add `locations`, `profiles`, and `messages` tables first.
5. Add vector column later if pgvector setup slows progress.
6. Add env vars locally and in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `APP_SECRET`
7. Deploy to Vercel immediately, even if the page only says `MyStudyFriend is live`.
8. Seed 5-10 locations, including `id=47` / Desk 47 / Main Library / Level 3.

Definition of done:

1. The Vercel URL loads on a phone.
2. A debug page or server component can fetch Desk 47 from Supabase.
3. README has setup commands and required env vars.

Fallback:

If Supabase setup blocks progress, use an in-memory or static `demoData.ts` file for the first QR archive page, then reconnect Supabase in the next phase.

## Hours 2-7 - Core QR Archive Loop

Goal:

Build the minimum product: scanning a QR opens a place archive where users can read and post messages.

Why this matters:

This is the product spine. If this does not work, embeddings, presence, and moderation do not matter.

Implementation steps:

1. Create `app/desk/[locationId]/page.tsx`.
2. Read `locationId` from params and fetch the matching location.
3. Fetch messages where `location_id` equals the current desk.
4. Start with `created_at` descending. Ranking comes later.
5. Create a simple message card UI:
   - body
   - tags if available
   - pseudonym placeholder
   - timestamp
6. Create a message submission form with textarea and submit button.
7. Create `POST /api/messages`.
8. Validate non-empty text.
9. Insert into `messages`.
10. Return success.
11. Use a physical QR code outside the app that opens the deployed `/desk/47` URL.
12. Do not build QR generation, a scanner library, or browser camera features.
13. Seed 20+ emotionally strong messages for Desk 47 and 2-3 other locations so the demo has content before live posting.

Definition of done:

1. Phone native camera scans QR and opens Desk 47.
2. Desk 47 page shows seeded messages.
3. Submitting a message saves it and it appears on refresh.
4. The page is usable on mobile.

Fallback:

If API routes slow you down, insert directly from a client Supabase call using anon key and simple Row Level Security disabled for the demo project. Mark this as demo-only in README.

## Hours 7-12 - Onboarding/Profile

Goal:

Capture the minimal study context needed for personalisation: courses first, assessments only if there is time.

Why this matters:

The app's personalisation pillar depends on knowing what the student studies. Without this, the ranker cannot produce the COMP2521 vs FINS1613 demo moment.

Implementation steps:

1. Choose auth path.
2. Preferred auth: Supabase Auth magic link or Google.
3. Demo-safe fallback: profile selector stored in `localStorage`.
4. Create two demo profiles:
   - Alex = COMP2521/MATH1081
   - Jamie = FINS1613/ECON1101
5. Build a course picker with a static fallback list:
   - COMP1511
   - COMP2521
   - COMP1531
   - MATH1081
   - FINS1613
   - ECON1101
6. On first scan, if no profile/courses exist, show onboarding instead of the archive feed.
7. Save selected courses to `profiles.courses`.
8. Unlock the archive.
9. Only after this works, try DevSoc GraphQL course autocomplete.
10. Keep the static list as fallback.

Definition of done:

1. Fresh browser opens Desk 47 and sees onboarding.
2. User selects COMP2521 and enters the archive.
3. Returning to Desk 47 skips onboarding.
4. Profile switcher or demo auth can switch between COMP2521 and FINS1613 for the ranker demo.

Fallback:

If auth breaks, use a clearly labelled `Demo profile` dropdown and explain in the pitch that Supabase Auth is the production path.

## Hours 12-18 - Embeddings + Ranker

Goal:

Make the same desk feel different for different students by ranking messages against their study context.

Why this matters:

This is the strongest technical and product demo. It proves the archive is not a generic wall of text. It is a personalised memory layer tied to place and course context.

Implementation steps:

1. Create `lib/openai.ts` with `embedText(text)`.
2. Keep OpenAI calls server-side only.
3. Use `text-embedding-3-small`.
4. Embed seeded messages once and store embeddings in `messages.embedding`.
5. Use an admin script/button if easier.
6. Build context string from profile, for example:

```text
COMP2521, MATH1081, week 10, late night, final exam soon
```

7. For demo, current week/exam period can be hardcoded.
8. At read time, embed the context string.
9. Calculate similarity against candidate messages.
10. Add course-match score if `message.course_tags` intersects `profile.courses`.
11. Add temporal score, upvote score, and small age penalty only if they do not slow implementation.
12. Implement `why this message?` explanation labels, such as `matched COMP2521 + exam week`.
13. Prepare seeded messages so COMP2521 and FINS1613 rankings are visibly different.

Definition of done:

1. Desk 47 with Alex/COMP2521 shows COMP2521 exam/help messages near the top.
2. Desk 47 with Jamie/FINS1613 shows finance/economics messages near the top.
3. At least the top 3 messages show `why this message?` labels.
4. Ranking works on the deployed site, not only localhost.

Fallback:

If pgvector is hard, fetch 30 messages and rank them in JavaScript using tags/course overlap only. Keep the UI and demo moment. Add embeddings later if time remains.

## Hours 18-22 - Live Presence

Goal:

Show that other students are studying here now.

Why this matters:

Presence makes the archive feel alive even before the user reads a message. It supports the anti-isolation story directly.

Implementation steps:

1. On desk page load, join a Supabase Realtime Presence channel such as `presence:desk-47`.
2. Track:
   - `userId`
   - `locationId`
   - `building`
   - `onlineAt`
3. Display `X students here now` for the current desk/location.
4. Display `Y in Main Library`.
5. Either aggregate location channels or use a demo building presence count.
6. Test with multiple teammate phones on the deployed URL.
7. Implement `last_seen` fallback.
8. Update `profiles.last_seen` and `profiles.current_location_id` every 20 seconds.
9. Count users seen within the last 60 seconds.

Definition of done:

1. Opening the deployed Desk 47 page on a second phone changes the count.
2. Closing or leaving the page eventually reduces the count, or fallback count expires.
3. The demo script includes a teammate opening the same QR live.

Fallback:

Use `last_seen` polling if Realtime Presence is unstable. A reliable changing count is better than a broken `true realtime` feature.

## Hours 22-25 - Moderation And Tags

Goal:

Prevent obvious unsafe/spam content and label messages for ranking and UI clarity.

Why this matters:

Anonymous posting invites judge concerns. Moderation is the answer to `how does this not become Yik Yak?` Tags also feed the personalised ranking explanation.

Implementation steps:

1. Create `lib/moderation.ts`.
2. Add basic regex checks for:
   - URLs
   - emails
   - phone numbers
   - obvious abuse
3. In `POST /api/messages`, run regex filter before any database insert.
4. Call OpenAI Moderation for messages that pass regex.
5. If flagged, store as hidden/pending or reject with a friendly message.
6. Create local keyword tagger:
   - exam/final -> exam advice
   - `you got this` / `not alone` -> emotional support
   - tip/remember -> study tip
   - COMP2521/FINS1613 -> course tags
7. Store `tags` and `course_tags` on the message.
8. Display tags on cards.
9. Use tags in the ranker if embeddings are weak.

Definition of done:

1. A safe message posts successfully and gets tags.
2. A message containing a URL/email/phone is blocked.
3. A clearly unsafe message is blocked by moderation or hidden from public feed.
4. Tags appear in the UI and can support `why this message?` labels.

Fallback:

If OpenAI Moderation integration slows progress, keep regex + `status=pending` for questionable content and demo the block with links/emails. Add moderation call after core demo is stable.

## Hours 25-27 - Pseudonyms + Signed QR Token

Goal:

Add a lightweight trust/privacy layer without building fragile indoor GPS geofencing.

Why this matters:

Pseudonyms create continuity without exposing identity. Signed QR tokens show adversarial thinking and replace the high-risk GPS geofence for the demo.

Implementation steps:

1. Create `lib/pseudonym.ts`.
2. Derive a stable per-location hash using HMAC:

```text
HMAC(user_id + location_id, APP_SECRET)
```

3. Map hash output to friendly names such as:
   - Desk-47 Owl
   - Desk-47 Lantern
   - Main-Library Koala
4. Show the pseudonym on each message instead of real name/email.
5. Create signed token format for QR URLs:

```text
/desk/47?t=token
```

6. Token should encode `locationId` and expiry.
7. Sign token with `APP_SECRET`.
8. Verify token server-side before allowing message submission.
9. Reading can remain open if that keeps demo smoother.
10. Add a simple rate guard: one message per user/location every N minutes for demo safety.

Definition of done:

1. Same profile posting at Desk 47 gets the same Desk-47 pseudonym.
2. Same profile at a different location gets a different pseudonym.
3. Tampered or expired token is rejected for posting.
4. Pitch can say strict GPS geofencing is future work because indoor browser location is unreliable.

Fallback:

If token logic is too slow, keep pseudonyms and add a UI-only `verified scan` badge for the demo. Do not attempt GPS geofencing late.

## Hours 27-30 - UI Polish + Demo Content

Goal:

Make the demo legible, emotional, and mobile-friendly.

Why this matters:

Judges experience the product through the demo, not the codebase. Seed content and UI clarity can matter more than another invisible backend feature.

Implementation steps:

1. Improve mobile layout:
   - clear scanned-desk landing title
   - readable cards
   - clear buttons
   - loading states
   - friendly error states
2. Create 20-40 seeded messages across 3-5 locations.
3. Include:
   - emotional support
   - study tips
   - course-specific advice
   - memories
4. Ensure seeded messages have course tags/upvotes so ranking differences are obvious.
5. Prepare the physical QR image for Desk 47 outside the app, ideally printable or displayed on another screen.
6. Take screenshots for Devpost image gallery:
   - onboarding
   - personalised feed
   - presence
   - moderation blocked state
7. Remove broken nav links or unfinished buttons.
8. Hidden unfinished features are better than visible dead ends.

Definition of done:

1. A person who knows nothing about the project can understand the app in 30 seconds.
2. The demo can be performed using only a phone and deployed site.
3. Screenshots are saved for Devpost.

Fallback:

If UI polish is behind, use a single beautiful Desk 47 page instead of multiple unfinished pages.

## Hours 30-32 - Deployment Smoke Test

Goal:

Freeze feature work and prove the final deployed demo works in a clean environment.

Why this matters:

Hackathon demos often fail because the team only tested localhost or a logged-in browser. This phase catches real demo issues.

Implementation steps:

1. Use a clean browser/private window on a phone.
2. Scan the QR from the phone camera, not by typing the URL.
3. Run the full demo checklist:
   - onboarding
   - ranked feed
   - profile switch
   - submit safe message
   - blocked bad message
   - presence count
   - token reject if implemented
4. Test on mobile data if possible to avoid relying on one WiFi network.
5. Record any bug and classify it:
   - demo-blocking
   - visual annoyance
   - safe to ignore
6. Freeze new features.
7. Only fix demo-blocking bugs.

Definition of done:

1. Full demo path passes twice on the deployed URL.
2. README has deployed URL, demo profiles, env vars, and known limitations.
3. The team knows which teammate does each live action.

Fallback:

If one feature is flaky, prepare a screenshot/video backup and be transparent that it is a fallback. Do not keep rewriting core code in the final two hours.

## Hours 32-34 - Pitch + Devpost Packaging

Goal:

Package the project so judges understand the story, technical depth, and limitations.

Why this matters:

A working product without a clear story can still lose. The submission must connect features back to the theme: connection through place, time, and strangers.

Implementation steps:

1. Record demo video before the final hour.
2. Do not wait for perfect UI.
3. Write Devpost sections:
   - inspiration/problem
   - what it does
   - how we built it
   - challenges
   - accomplishments
   - what we learned
   - what is next
4. Add screenshots:
   - QR scan
   - archive
   - onboarding
   - personalised ranking
   - presence
   - moderation
5. Write README for engineers:
   - stack
   - schema
   - env vars
   - setup
   - demo profiles
   - deployed URL
   - known limitations
6. Prepare a 2-3 minute live/demo script and assign who speaks when.
7. Prepare honest limitations:
   - static fallback courses
   - demo auth if used
   - geofencing deferred
   - seeded messages for demo scale

Definition of done:

1. Video, Devpost, README, screenshots, and GitHub repo are ready before the final deadline.
2. The team can deliver the story without explaining implementation details too early.
3. There is a backup plan if live demo fails.

Fallback:

If the live product is unstable, submit the best recorded demo and explain the architecture clearly in Devpost.

## Demo Data To Create Early

Locations:

- Desk 47 / Main Library Level 3
- Desk 48 / Main Library Level 3
- Law Library Desk 1
- Business School Study Booth
- CSE Lab Table

Profiles:

- Alex = COMP2521 + MATH1081 + `COMP2521 final in 3 days`
- Jamie = FINS1613 + ECON1101 + `FINS1613 quiz in 2 days`

Seed message categories:

- emotional support
- study tip
- exam advice
- memory
- course-specific advice
- late-night encouragement

Ranking seed rule:

- At least 6 COMP2521-heavy messages at Desk 47.
- At least 6 FINS1613-heavy messages at Desk 47.
- The reordering must be obvious.

## Demo Script Checkpoint

1. Open with the problem:

```text
Most students study surrounded by people but still feel alone. What if the desk remembered everyone who survived this week before you?
```

2. Scan Desk 47 QR with a phone.
3. Land on the archive page.
4. If first-time flow appears, choose COMP2521 and unlock the archive.
5. Show that COMP2521 exam/support messages appear first.
6. Point to the `why this message?` label.
7. Switch to FINS1613 profile and show the same desk reorders differently.
8. Have a teammate open the same QR.
9. Presence count increases.
10. Post a safe message.
11. It appears with tags and a per-desk pseudonym.
12. Try posting a link/email/spam message.
13. It is blocked.
14. Close with the theme:

```text
connection through place, connection through time, and connection between students who never meet.
```

## Cut List If Behind Schedule

Cut these in this exact order.

Do not cut:

- QR archive loop
- onboarding
- profile-based reordering

Cut order:

1. DevSoc GraphQL live integration: use static courses/locations.
2. Real geofencing: keep signed token or skip location verification entirely.
3. Assessment due-date UI: use courses only or hardcoded demo assessment.
4. Heatmap: use simple presence count cards.
5. LLM auto-tagging: use local keyword tagger.
6. Full auth: use demo profile selector.
7. Admin moderation dashboard: use status field and hide flagged content.

## Information Future AI Should Not Assume

1. Do not assume DevSoc GraphQL has all needed data.
2. Verify the API, but keep fallback lists.
3. Do not assume browser geolocation works indoors.
4. Browser geolocation is unreliable for this demo and should not be a blocker.
5. Do not assume empty databases are acceptable.
6. Seed content is required for the emotional story.
7. Do not assume ranking must be perfect.
8. The requirement is a visible, explainable reordering for the demo profiles.
9. Do not assume production security is complete.
10. Mark demo-only shortcuts clearly in README.

## Source Notes For Implementation Choices

- Supabase provides Postgres, Auth, Realtime subscriptions, Storage, and Vector embeddings in one platform: https://supabase.com/
- Supabase Realtime Presence is designed for tracking and synchronising connected-user state: https://supabase.com/docs/guides/realtime/presence
- Supabase vector columns use pgvector in Postgres to store/query embeddings: https://supabase.com/docs/guides/ai/vector-columns
- OpenAI text embeddings support search/recommendation/classification-style similarity, and `text-embedding-3-small` is the cheap default for this demo: https://developers.openai.com/api/docs/guides/embeddings
- OpenAI Moderation can check text/images for potentially harmful content: https://developers.openai.com/api/docs/guides/moderation
- MDN documents browser geolocation requirements and permission constraints: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Vercel can automatically deploy Git repository pushes and is a natural fit for Next.js: https://vercel.com/docs/git
- DevSoc GraphQL API should be verified directly before depending on live building/course data: https://github.com/devsoc-unsw/graphql-api

## Copy-Paste Prompt For Another AI

```text
You are continuing a DevSoc hackathon project called MyStudyFriend.

Read this document first.

The product spine is:
scan a desk QR -> place archive -> course onboarding -> personalised ranked messages -> live presence -> moderated anonymous posting.

Continue from the earliest incomplete checkpoint in Section 6.

Do not add new features until the QR archive loop, onboarding, profile-based reordering, presence count, and moderation demo all pass on the deployed Vercel URL.

Use static fallback data whenever live integrations are unstable.

Update README with completed work, broken work, fallbacks, and next action after each checkpoint.
```
