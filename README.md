# DeskSupport / MyStudyFriend

QR-first campus place archive for the DevSoc Flagship Hackathon theme:
connection through places, time, and students who never meet.

## Hour 0-2 Status

Completed:

- Created a Next.js App Router project with TypeScript, Tailwind, ESLint, and npm scripts.
- Installed core packages: `@supabase/supabase-js`, `openai`, and `qrcode`.
- Added typed Supabase browser/server helpers in `lib/supabase/`.
- Added an OpenAI client helper in `lib/openai.ts`.
- Added minimum Supabase schema and seed SQL for `locations`, `profiles`, and `messages`.
- Seeded 8 demo locations, including `id=47` / Desk 47 / Main Library / Level 3.
- Added `/desk/47` as the first QR landing route.
- Added `/api/health` to verify app status and Desk 47 lookup source.
- Added static fallback data so the app builds and demos before Supabase env vars are connected.

Broken or blocked:

- Supabase is not connected locally because env vars are missing.
- Vercel deployment is not complete from this machine because Vercel project/auth/env access was not available.

Fallback used:

- `lib/demoData.ts` mirrors the seeded locations and powers `/desk/47` until Supabase credentials are configured.

Next action:

- Create/connect the Supabase project, run `supabase/schema.sql` and `supabase/seed.sql`, add env vars locally and in Vercel, then confirm `/api/health` reports `supabaseConfigured: true` and `desk47.source: "supabase"`.

Demo risk:

- Low for local skeleton and Desk 47 route.
- Medium until the deployed Vercel URL is live and reading Supabase.

Verification performed:

- `npm run lint` passes.
- `npm run build` passes.
- Local dev server started at `http://127.0.0.1:3000`.
- `/api/health` returns Desk 47 from `seed-fallback` while Supabase env vars are missing.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or go straight to `http://localhost:3000/desk/47`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
APP_SECRET=
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are needed for the Hour 0-2 Desk 47 fetch check. `OPENAI_API_KEY` and `APP_SECRET` are reserved for later ranking, moderation, and signed QR work.

## Supabase Bootstrap

Run these SQL files in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Minimum tables:

- `locations`
- `profiles`
- `messages`

The demo seed includes Desk 47 and seven other campus locations.

## Verification

```bash
npm run lint
npm run build
```

Then check:

- `/` shows the Hour 0-2 checkpoint status.
- `/desk/47` renders Desk 47.
- `/api/health` returns JSON with Desk 47 lookup status.

## Deployment

Deploy this repo to Vercel as a standard Next.js app. Add the same env vars in Vercel Project Settings before checking the Supabase connection on the deployed URL.
