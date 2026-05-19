# Hour 0-2 Debugging Handoff

Date: 2026-05-19

This document explains what I did, why I did it, and what happened after each step. It is written for a human teammate who may not have experience with Next.js, Supabase, TypeScript, or this codebase.

Generated folders are not explained file-by-file:

- `node_modules/` is downloaded package code.
- `.next/` is build/dev-server output.
- `.git/` is Git history.

Do not manually edit those folders.

## The Goal For Hour 0-2

The project plan said the first checkpoint should create the app skeleton and prove the app can load Desk 47 from Supabase.

The exact goal was:

1. Create a Next.js app.
2. Add TypeScript, Tailwind, and App Router.
3. Add Supabase support.
4. Create minimum database tables.
5. Seed Desk 47.
6. Make a page that can fetch Desk 47.
7. Keep the app deployable even if Supabase is not connected yet.

I could not connect a real Supabase project or Vercel project from this machine because the needed credentials were not available. To avoid blocking the app, I added a local fallback data file that contains Desk 47. This means the app works now and can switch to Supabase later when env vars are added.

## Step-By-Step: What I Did

### Step 1: I read the project handoff document

What I did:

- I read the `6. AI Handoff & 34-Hour Execution Plan` section from the Word document.
- I focused on `Hours 0-2 - Freeze scope + infrastructure`.

Why I did it:

- I needed to know the earliest unfinished checkpoint instead of guessing what to build.
- The plan said not to add extra features before the infrastructure and Desk 47 fetch path were working.

What happened after:

- I knew the first deliverable was not the full app.
- The first deliverable was a working skeleton with a Desk 47 data check.

### Step 2: I cloned the GitHub repo

What I did:

- I cloned `https://github.com/SeaCleaver/DeskSupport.git`.

Why I did it:

- The local folder was not a Git repo yet.
- The user gave this repo as the project source.

What happened after:

- The repo had only a small README.
- That meant I needed to create the Next.js project from scratch inside the repo.

### Step 3: I scaffolded a Next.js app

What I did:

- I used `create-next-app` with TypeScript, Tailwind, ESLint, App Router, and npm.
- The repo folder is named `DeskSupport`.
- `create-next-app` rejected that name because npm package names cannot contain capital letters.
- I created the scaffold in a temporary lowercase folder, then copied the generated files into `DeskSupport`.

Why I did it:

- Next.js gives the routing, backend API routes, frontend app, build system, and Vercel-friendly deployment path.
- TypeScript catches mistakes early.
- Tailwind lets us build the UI quickly.
- App Router matches the project plan.

What happened after:

- The repo had a standard Next.js structure:
  - `app/`
  - `public/`
  - `package.json`
  - `tsconfig.json`
  - config files
- The generated starter page still needed to be replaced.

### Step 4: I installed the project dependencies

What I did:

- I installed:
  - `@supabase/supabase-js`
  - `openai`
  - `qrcode`
  - `@types/qrcode`

Why I did it:

- Supabase is needed for database access.
- OpenAI is planned for later embeddings and moderation.
- QR code generation is planned for the next checkpoint.
- `@types/qrcode` helps TypeScript understand the QR package.

What happened after:

- `package.json` listed the dependencies.
- `package-lock.json` recorded exact versions.
- The app could compile with these packages available.

### Step 5: I checked the generated Next.js instructions

What I did:

- The generated `AGENTS.md` warned that this Next.js version has API changes.
- I checked the local Next.js docs inside `node_modules/next/dist/docs/`.

Why I did it:

- Next.js 16 uses newer App Router behavior.
- Dynamic route `params` are typed as a Promise in the current docs.

What happened after:

- I wrote `app/desk/[locationId]/page.tsx` using:

```ts
params: Promise<{ locationId: string }>
```

instead of older examples that treat `params` as a plain object.

### Step 6: I checked environment variables

What I did:

- I checked whether these env vars existed locally:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `APP_SECRET`

Why I did it:

- The app cannot talk to Supabase or OpenAI without env vars.
- I needed to know whether real Supabase access was possible right away.

What happened after:

- None of the env vars were present.
- I decided the app must use fallback demo data until the real env vars are added.

### Step 7: I added local fallback location data

What I did:

- I created `lib/demoData.ts`.
- It contains 8 campus locations.
- It includes Desk 47:
  - `id: 47`
  - `name: "Desk 47"`
  - `building: "Main Library"`
  - `floor: "Level 3"`

Why I did it:

- The hackathon plan says an empty archive kills the demo.
- The app should not show a blank or broken page just because Supabase is not ready.
- Desk 47 must exist immediately.

What happened after:

- `/desk/47` can work without Supabase.
- The same locations are also mirrored in `supabase/seed.sql` so the fallback data and database seed match.

### Step 8: I added Supabase helper files

What I did:

- I created:
  - `lib/supabase/server.ts`
  - `lib/supabase/client.ts`
  - `lib/supabase/database.types.ts`

Why I did it:

- Supabase setup should live in one place instead of being copied into every page.
- Server-side code and browser-side code need slightly different Supabase helpers.
- TypeScript needs to know the shape of database rows.

What happened after:

- Server pages can call `createServerSupabaseClient()`.
- Future browser features can call `createBrowserSupabaseClient()`.
- TypeScript knows what `locations`, `profiles`, and `messages` look like.

### Step 9: I added one central location fetch function

What I did:

- I created `lib/locations.ts`.
- It exports `getLocationById(locationId)`.

Why I did it:

- Pages should not each implement their own Supabase/fallback logic.
- If the data source changes later, we only update one file.

What happened after:

- Any page can ask for a location by id.
- The function tries Supabase if possible.
- If Supabase is missing, broken, or missing the row, it uses `lib/demoData.ts`.

Simple flow:

```text
Page asks for Desk 47
-> getLocationById("47")
-> try Supabase if env vars exist
-> otherwise use demoData
-> return location plus the source name
```

### Step 10: I replaced the generated homepage

What I did:

- I replaced the default `app/page.tsx`.
- The homepage now shows an Hour 0-2 status screen.

Why I did it:

- The default Next.js starter page was not useful for the project.
- We needed a visible page proving the skeleton is alive.

What happened after:

- Opening `/` shows:
  - project name
  - checkpoint status
  - Supabase status
  - Desk 47 status
  - link to `/desk/47`
  - link to `/api/health`

### Step 11: I added the Desk 47 route

What I did:

- I created `app/desk/[locationId]/page.tsx`.

Why I did it:

- The final product starts when a student scans a QR code.
- A QR code should open a URL like `/desk/47`.
- `[locationId]` means the page works for different desks, not only Desk 47.

What happened after:

- `/desk/47` renders a Desk 47 page.
- `/desk/48` would try to render Desk 48.
- The page currently shows an archive shell, not real messages yet.
- Message reading/posting belongs to Hours 2-7.

### Step 12: I added a health/debug endpoint

What I did:

- I created `app/api/health/route.ts`.

Why I did it:

- A human debugger needs a simple way to see what the app thinks is happening.
- JSON is easier to inspect than a styled page when debugging data issues.

What happened after:

- Opening `/api/health` returns JSON.
- It tells you:
  - whether Desk 47 was found
  - whether Supabase env vars are configured
  - whether Desk 47 came from Supabase or fallback data
  - the error message if fallback was used

### Step 13: I added Supabase SQL files

What I did:

- I created:
  - `supabase/schema.sql`
  - `supabase/seed.sql`

Why I did it:

- A teammate needs exact SQL to create the database tables.
- The database should match what the TypeScript code expects.

What happened after:

- `schema.sql` can create the minimum tables:
  - `locations`
  - `profiles`
  - `messages`
- `seed.sql` can insert Desk 47 and 7 other locations.

### Step 14: I added env var documentation

What I did:

- I created `.env.example`.
- I changed `.gitignore` so `.env.example` can be committed, while real `.env` files stay ignored.

Why I did it:

- New developers need to know which env vars to create.
- Real secrets should never be pushed to GitHub.

What happened after:

- A teammate can copy `.env.example` to `.env.local`.
- Git will still ignore `.env.local`.

### Step 15: I adjusted app metadata and styling

What I did:

- I updated `app/layout.tsx`.
- I updated `app/globals.css`.

Why I did it:

- The browser title should say `MyStudyFriend`, not `Create Next App`.
- The starter styling should look like this product, not the default template.

What happened after:

- The app title and description match the project.
- The pages use a warm, simple campus-study style.

### Step 16: I fixed a TypeScript build error

What happened:

- The first production build failed.
- Supabase allows `floor` and `description` to be `null`.
- My first local demo type said they were always strings.

Why that mattered:

- TypeScript rejected assigning a Supabase location row to the same type as a demo location.

What I changed:

- I updated `LocationRecord` in `lib/locations.ts` so:
  - `floor` can be `string | null`
  - `description` can be `string | null`

What happened after:

- TypeScript accepted both Supabase data and fallback data.

### Step 17: I fixed a Next.js root warning

What happened:

- `next build` warned that it found another `package-lock.json` above this repo at `C:\Users\Admin\package-lock.json`.
- Next.js was unsure which folder was the real project root.

What I changed:

- I set this in `next.config.ts`:

```ts
turbopack: {
  root: process.cwd(),
}
```

Why I did it:

- It tells Next.js/Turbopack that the current repo folder is the app root.

What happened after:

- The warning stopped.
- The build used the correct project root.

### Step 18: I verified the app

What I did:

- Ran `npm run lint`.
- Ran `npm run build`.
- Started the dev server.
- Opened `/api/health`.
- Checked `/desk/47`.

Why I did it:

- A checkpoint is not done until the app actually builds and the important routes respond.

What happened after:

- Lint passed.
- Build passed.
- `/api/health` returned Desk 47 from `seed-fallback`.
- `/desk/47` returned HTTP 200 and rendered Desk 47.

## How The App Works Right Now

When the browser opens `/desk/47`:

1. Next.js sees the route folder `app/desk/[locationId]/`.
2. It loads `page.tsx` inside that folder.
3. The page reads `locationId` from the URL.
4. The page calls `getLocationById(locationId)`.
5. `getLocationById` checks whether Supabase is configured.
6. If Supabase is not configured, it reads from `lib/demoData.ts`.
7. If Supabase is configured, it queries the `locations` table.
8. The page receives the location.
9. The page renders the location name, building, floor, and data source.

Important result:

- The app works without Supabase.
- When Supabase credentials are added and the SQL files are run, the same page should start using Supabase.

## Every File In The Codebase

This section covers every source/config file currently in the repo. It does not cover generated dependency/build files.

### Root Files

#### `.env.example`

What it is:

- A template showing which env vars the app needs.

Why it exists:

- New developers need to know what to put in `.env.local`.
- This file is safe to commit because it does not contain real secrets.

What happens after using it:

- Copy it to `.env.local`.
- Fill in the values.
- Restart `npm run dev`.
- `/api/health` should then see the Supabase env vars.

#### `.gitignore`

What it is:

- A list of files Git should ignore.

Why it exists:

- We do not want to commit `node_modules`, `.next`, `.env.local`, logs, or build output.
- We do want to commit `.env.example`, so I added an exception for it.

What happens after:

- Real secrets stay local.
- The env template stays visible to teammates.

#### `AGENTS.md`

What it is:

- A generated instruction file for coding agents.

Why it exists:

- It warns that this Next.js version has changed APIs.
- It tells future AI assistants to check the local Next.js docs before editing.

What happens after:

- Future AI work should be less likely to use old Next.js patterns.

#### `CLAUDE.md`

What it is:

- A tiny pointer file containing `@AGENTS.md`.

Why it exists:

- Some AI tools read `CLAUDE.md`.
- This file redirects them to the same instructions in `AGENTS.md`.

What happens after:

- Different AI tools get the same Next.js warning.

#### `README.md`

What it is:

- The main developer-facing project summary.

Why it exists:

- It records setup, env vars, Supabase bootstrap steps, verification, and deployment notes.

What happens after:

- A teammate can start from README for quick setup.
- This handoff doc gives the deeper explanation.

#### `eslint.config.mjs`

What it is:

- ESLint configuration.

Why it exists:

- ESLint checks the code for common mistakes.
- The config uses Next.js recommended rules and TypeScript rules.

What happens after:

- Running `npm run lint` checks the project.

#### `next-env.d.ts`

What it is:

- A generated TypeScript file from Next.js.

Why it exists:

- It lets TypeScript understand Next.js-specific types.

What happens after:

- TypeScript can compile Next.js files correctly.
- Do not manually edit it.
- It is ignored by Git because Next.js can regenerate it.

#### `next.config.ts`

What it is:

- Main Next.js configuration.

Why it exists:

- I set `turbopack.root` to `process.cwd()`.
- This fixes the warning where Next.js found another lockfile outside the repo.

What happens after:

- Next.js treats this repo folder as the project root.

#### `package.json`

What it is:

- The npm project definition.

Why it exists:

- It names the project.
- It defines scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
  - `npm run lint`
- It lists dependencies.

What happens after:

- npm knows how to install and run the app.

#### `package-lock.json`

What it is:

- The exact dependency lockfile.

Why it exists:

- It makes installs more repeatable.

What happens after:

- Teammates should get the same dependency versions when they run `npm install`.
- Do not edit it manually. npm updates it.

#### `postcss.config.mjs`

What it is:

- PostCSS configuration.

Why it exists:

- Tailwind CSS v4 uses the `@tailwindcss/postcss` plugin.
- This file tells Next.js how to process Tailwind CSS.

What happens after:

- Tailwind classes in the page files work.

#### `tsconfig.json`

What it is:

- TypeScript configuration.

Why it exists:

- It turns on strict TypeScript checking.
- It tells TypeScript how to compile JSX.
- It defines the alias `@/*`, so code can import with paths like `@/lib/locations`.

What happens after:

- Imports are cleaner.
- TypeScript catches mismatched data shapes.

### App Files

#### `app/layout.tsx`

What it is:

- The root layout for every page.

Why it exists:

- Next.js requires a root layout in the App Router.
- It loads fonts.
- It loads `app/globals.css`.
- It sets page metadata.

What happens after:

- Every route gets the same base HTML structure.
- Browser title/metadata use `MyStudyFriend`.

#### `app/globals.css`

What it is:

- Global CSS.

Why it exists:

- It imports Tailwind.
- It defines the app background and text color.
- It connects the Next.js font variables to Tailwind theme values.

What happens after:

- All pages share the same base styling.

#### `app/page.tsx`

What it is:

- The homepage at `/`.

Why it exists:

- It replaces the default Next.js starter page.
- It proves the checkpoint is working.

What happens after:

- Opening `/` shows:
  - project status
  - Desk 47 status
  - Supabase/fallback status
  - link to `/desk/47`
  - link to `/api/health`

Important code:

- It calls `getLocationById("47")`.
- That proves the data helper works from a server-rendered page.

#### `app/desk/[locationId]/page.tsx`

What it is:

- Dynamic desk route.

Why it exists:

- QR codes need URLs like `/desk/47`.
- The `[locationId]` folder lets one page handle many location ids.

What happens after:

- `/desk/47` loads Desk 47.
- If no location is found, it calls `notFound()` and Next.js shows a 404.
- For now, it shows an archive shell. The real message feed comes next.

Important code:

- `export const dynamic = "force-dynamic";`
- This tells Next.js to render the page on demand instead of treating it as a fixed static page.

#### `app/api/health/route.ts`

What it is:

- Debug API route at `/api/health`.

Why it exists:

- Humans need a quick way to check app state.

What happens after:

- Browser returns JSON like:

```json
{
  "ok": true,
  "app": "MyStudyFriend",
  "checkpoint": "hours-0-2",
  "supabaseConfigured": false,
  "desk47": {
    "source": "seed-fallback"
  }
}
```

Use this first when data looks wrong.

#### `app/favicon.ico`

What it is:

- Browser tab icon.

Why it exists:

- Generated by the Next.js template.

What happens after:

- The app has a favicon.
- It is not important for current functionality.

### Library Files

#### `lib/demoData.ts`

What it is:

- Local demo location data.

Why it exists:

- Supabase env vars were missing.
- The app still needed to show Desk 47.

What happens after:

- If Supabase is unavailable, the app can still load locations.

Important function:

- `getDemoLocationById(locationId)`
- It converts the URL value into a number and finds the matching demo location.

#### `lib/locations.ts`

What it is:

- The central location data helper.

Why it exists:

- It keeps data fetching simple for pages.
- Pages do not need to know how Supabase or fallback data work.

What happens after:

- Pages call `getLocationById`.
- The helper returns:
  - `location`
  - `source`
  - optional `error`

Important behavior:

- If Supabase is not configured, it returns fallback data.
- If Supabase errors, it returns fallback data plus the error.
- If Supabase works, it returns Supabase data.

#### `lib/openai.ts`

What it is:

- OpenAI client helper.

Why it exists:

- Later checkpoints need embeddings and moderation.
- OpenAI setup should not be copied into many files.

What happens after:

- Calling `createOpenAIClient()` returns:
  - an OpenAI client if `OPENAI_API_KEY` exists
  - `null` if the key is missing

It is not used in Hour 0-2 yet.

#### `lib/supabase/server.ts`

What it is:

- Server-side Supabase helper.

Why it exists:

- Server-rendered pages and API routes need database access.

What happens after:

- `hasSupabaseConfig()` checks whether required env vars exist.
- `createServerSupabaseClient()` returns a Supabase client if env vars exist.
- If env vars are missing, it returns `null` so the app does not crash.

#### `lib/supabase/client.ts`

What it is:

- Browser-side Supabase helper.

Why it exists:

- Later checkpoints may need Supabase in interactive browser components.
- Examples: live presence, profile selector, client-side posting.

What happens after:

- It creates a browser Supabase client.
- It throws an error if env vars are missing.
- This is okay because browser features should fail clearly during development.

#### `lib/supabase/database.types.ts`

What it is:

- TypeScript description of the database tables.

Why it exists:

- Supabase returns database rows.
- TypeScript needs to know what fields those rows contain.

What happens after:

- If code asks for a field that does not exist, TypeScript can catch it.
- If the SQL schema changes, this file should be updated.

Tables described:

- `locations`
- `profiles`
- `messages`

### Supabase Files

#### `supabase/schema.sql`

What it is:

- SQL for creating database tables.

Why it exists:

- A teammate needs a repeatable way to create the database.

What happens after running it:

- Supabase has the minimum tables needed by this checkpoint.
- Row Level Security is enabled.
- Basic demo policies allow:
  - public reading of locations
  - public reading of public messages
  - demo inserting of messages
  - demo reading of profiles

Important note:

- This is demo-friendly, not final production security.

#### `supabase/seed.sql`

What it is:

- SQL for inserting starting location data.

Why it exists:

- Desk 47 must exist before the demo.

What happens after running it:

- Supabase has 8 locations.
- Desk 47 exists with `id = 47`.
- The app can fetch Desk 47 from Supabase instead of fallback data.

### Public Asset Files

These came from the Next.js starter template.

#### `public/file.svg`

What it is:

- Starter SVG asset.

Why it exists:

- Generated by Next.js.

What happens after:

- Currently unused by our app.
- Safe to remove later if cleanup is needed.

#### `public/globe.svg`

What it is:

- Starter SVG asset.

Why it exists:

- Generated by Next.js.

What happens after:

- Currently unused.

#### `public/next.svg`

What it is:

- Next.js logo asset.

Why it exists:

- Generated by Next.js.

What happens after:

- Currently unused after replacing the starter homepage.

#### `public/vercel.svg`

What it is:

- Vercel logo asset.

Why it exists:

- Generated by Next.js.

What happens after:

- Currently unused.

#### `public/window.svg`

What it is:

- Starter SVG asset.

Why it exists:

- Generated by Next.js.

What happens after:

- Currently unused.

### Docs File

#### `docs/hour-0-2-debugging-handoff.md`

What it is:

- This file.

Why it exists:

- It explains the checkpoint in plain language.
- It helps a human teammate understand and debug the codebase.

What happens after:

- Future teammates should update this style of explanation when they complete later checkpoints.

## Debugging Guide

### If `/desk/47` loads but says `Seed fallback`

What it means:

- The app is working.
- Supabase is not being used yet.

Check:

1. Open `/api/health`.
2. Read `desk47.error`.
3. Check `.env.local`.
4. Restart `npm run dev`.
5. Confirm `schema.sql` and `seed.sql` were run in Supabase.

### If `/api/health` says `supabaseConfigured: false`

What it means:

- The app cannot see Supabase URL/key.

Check:

1. `.env.local` exists.
2. It contains `NEXT_PUBLIC_SUPABASE_URL`.
3. It contains `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. The dev server was restarted after adding them.

### If `/api/health` says `supabaseConfigured: true` but still uses fallback

What it means:

- Env vars exist, but Supabase did not return Desk 47.

Check:

1. The `locations` table exists.
2. The row with `id = 47` exists.
3. Row Level Security allows reading locations.
4. The Supabase URL/key belong to the correct project.

### If TypeScript or build fails

Check:

1. Read the error line.
2. If the error mentions Supabase rows or fields, check `lib/supabase/database.types.ts`.
3. If the SQL schema changed, update the TypeScript types too.
4. Run `npm run build` again.

### If styling looks wrong

Check:

1. `app/globals.css`.
2. Tailwind class names inside `app/page.tsx`.
3. Tailwind class names inside `app/desk/[locationId]/page.tsx`.
4. `postcss.config.mjs` if Tailwind is not applying at all.

## Verification Performed

I ran:

```bash
npm run lint
npm run build
```

Both passed.

I also started the local dev server and checked:

- `/api/health`
- `/desk/47`

Result:

- `/api/health` returned `ok: true`.
- `supabaseConfigured` was `false`, which is expected because env vars are missing.
- `desk47.source` was `seed-fallback`, which is expected until Supabase is connected.
- `/desk/47` returned HTTP 200 and rendered Desk 47.

## Latest Step 7-8 Check

This was checked after the Supabase URL and anon key were added.

What I did:

1. Found `.env.local` one folder above the app at `Hackathon/.env.local`.
2. Copied it into the actual Next.js project root at `Hackathon/DeskSupport/.env.local`.
3. Restarted the DeskSupport dev server on `http://127.0.0.1:3000`.
4. Opened `/api/health`.

What happened:

```json
{
  "ok": true,
  "supabaseConfigured": true,
  "desk47": {
    "source": "seed-fallback",
    "error": "Could not find the table 'public.locations' in the schema cache"
  }
}
```

What this means:

- The app can now see the Supabase env vars.
- The app can reach Supabase.
- Supabase does not have the `public.locations` table yet.
- Because the table is missing, the app falls back to local demo data.
- This is not complete for Hour 0-2 because the target requires `desk47.source` to be `supabase`.

What must happen next:

1. Open the Supabase project.
2. Go to the SQL editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Refresh `http://127.0.0.1:3000/api/health`.
6. Confirm `desk47.source` becomes `supabase`.

Why I did not run the SQL from the terminal:

- `.env.local` only contains the public Supabase URL and anon key.
- Those are enough for the app to read public data.
- They are not enough to create database tables.
- Creating tables requires the Supabase SQL editor, Supabase CLI with a linked project, or a database connection string with permission to run DDL.

## Known Blockers

Supabase env vars are connected locally, but the database schema is not created yet.

Why:

- `/api/health` reports: `Could not find the table 'public.locations' in the schema cache`.

What needs to happen:

1. Create or open the Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Open `/api/health`.
5. Confirm `desk47.source` becomes `supabase`.

Vercel is not deployed yet from this machine.

Why:

- Vercel auth/project access was not available.

What needs to happen:

1. Connect the GitHub repo to Vercel.
2. Add the same env vars in Vercel project settings.
3. Deploy.
4. Open the deployed `/api/health`.
5. Confirm the deployed app can read Desk 47 from Supabase.

## Known Local Warnings

npm engine warning:

- One transitive ESLint package expects Node `^20.19.0` or newer.
- This shell is Node `20.15.0`.
- Lint and build still passed.

npm audit warning:

- `npm audit` reports moderate advisories through Next's nested PostCSS dependency.
- The suggested forced fix would downgrade Next and is not appropriate during this checkpoint.

## Next Checkpoint: Hours 2-7

Next work should build the core QR archive loop.

Do this next:

1. Fetch messages for the current location.
2. Render message cards on `/desk/[locationId]`.
3. Add a message form.
4. Add `POST /api/messages`.
5. Save messages to Supabase.
6. Generate Desk 47 QR code for the deployed URL.
7. Seed at least 20 strong Desk 47 messages before demo rehearsal.

Do not jump to embeddings, presence, moderation, or pseudonyms until the basic read/post archive loop works.
