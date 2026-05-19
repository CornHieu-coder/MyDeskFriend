# Hour 7-12 Debugging Handoff

This handoff explains the onboarding/profile checkpoint in simple steps.

Hour 7-12 goal:

```text
physical QR scan
-> /desk/47
-> if this browser has no study profile, show onboarding
-> save courses locally
-> unlock the Desk 47 archive
```

## What Exists Now

The app now uses a local browser profile.

The localStorage key is:

```text
mystudyfriend_profile
```

Example saved value:

```json
{
  "profileId": "alex",
  "displayName": "Alex",
  "courses": ["COMP2521", "MATH1081"]
}
```

This is demo-only profile storage.

It is not Supabase Auth.

It does not store sensitive data.

## User Flow

### First visit in a fresh browser

1. User opens `/desk/47`.
2. The page checks `localStorage`.
3. If `mystudyfriend_profile` is missing, the archive is hidden.
4. The user sees onboarding.
5. The user chooses Alex, Jamie, or manual courses.
6. The app saves the profile to `localStorage`.
7. The archive appears.

### Returning visit in the same browser

1. User opens `/desk/47`.
2. The app finds `mystudyfriend_profile`.
3. Onboarding is skipped.
4. The archive appears immediately after the browser check.

### Different phone, browser, or Incognito

1. That browser has its own `localStorage`.
2. It will not have the saved profile.
3. Onboarding appears again.

This is expected.

## Demo Personas

The demo profiles are choices shown inside onboarding.

They are not real authenticated users.

### Alex

```json
{
  "profileId": "alex",
  "displayName": "Alex",
  "courses": ["COMP2521", "MATH1081"]
}
```

### Jamie

```json
{
  "profileId": "jamie",
  "displayName": "Jamie",
  "courses": ["FINS1613", "ECON1101"]
}
```

## Manual Course Picker

The static course list is:

```text
COMP1511
COMP2521
COMP1531
MATH1081
FINS1613
ECON1101
```

Manual picker behavior:

1. User clicks one or more course chips.
2. The app switches to a manual profile.
3. The display name becomes `You`.
4. User clicks `Enter archive`.
5. The selected courses are saved.

At least one course is required.

If no course is selected, the app shows:

```text
Choose at least one course before entering the archive.
```

## Profile Banner

After onboarding, the archive shows a banner above the messages.

Alex example:

```text
Personalised for Alex · COMP2521 · MATH1081
```

Jamie example:

```text
Personalised for Jamie · FINS1613 · ECON1101
```

The banner has:

```text
Switch profile
```

Clicking it reopens onboarding so the demo can switch between Alex and Jamie.

## Why This Is Client-Side

`localStorage` only exists in the browser.

Server components cannot read it.

So the profile/onboarding logic lives in a client component:

```text
app/desk/[locationId]/desk-archive-client.tsx
```

How hydration is protected:

1. The component starts with a loading/checking state.
2. It does not read `localStorage` during the first render.
3. `useEffect` runs after the component mounts in the browser.
4. Only then does it decide whether to show onboarding or the archive.

This avoids server/client mismatch bugs.

## Files Changed

### `app/desk/[locationId]/page.tsx`

What changed:

- The server page still fetches the location.
- The server page still fetches messages.
- The server page now passes that data into `DeskArchiveClient`.

Why:

- Supabase fetching belongs on the server.
- `localStorage` profile gating belongs in the browser.

What happens after:

- The server page stays simple.
- The browser controls whether onboarding or archive is visible.

### `app/desk/[locationId]/desk-archive-client.tsx`

What changed:

- New client component.
- Checks `localStorage` for `mystudyfriend_profile`.
- Shows onboarding if no profile exists.
- Shows the archive if a profile exists.
- Saves Alex, Jamie, or manual course choices.
- Shows the profile banner.
- Lets the user switch profile.

Why:

- The app needs per-browser onboarding.
- A different phone or Incognito browser should start fresh.

What happens after:

- First-time users must choose courses before seeing Desk 47 messages.
- Returning users skip onboarding.
- Demo speaker can switch Alex/Jamie live.

### `app/desk/[locationId]/message-composer.tsx`

What changed:

- No major onboarding change.
- It still posts messages after the archive is unlocked.

Why:

- Posting already worked in Hour 2-7.
- This checkpoint should not rebuild posting.

What happens after:

- Message posting still uses `demo_user_id`.
- Message posting still creates stable anonymous labels.

### `app/api/health/route.ts`

What changed:

- `checkpoint` now returns:

```text
hours-7-12
```

Why:

- `/api/health` should show the current completed checkpoint.

What happens after:

- Opening `/api/health` confirms the code has moved beyond Hour 2-7.

### `README.md`

What changed:

- Added Hour 7-12 status.
- Added onboarding verification steps.
- Added the new client component to the file map.
- Added this handoff file to the handoff list.

Why:

- A beginner should be able to see what changed without reading every code file first.

## What Was Not Built

These were intentionally skipped:

```text
Supabase Auth
email magic links
Google login
DevSoc GraphQL autocomplete
assessment due dates
embeddings/ranking
presence
moderation
```

Why:

- The Hour 7-12 checkpoint only needs course onboarding and local demo profiles.

## How To Debug

### Onboarding does not appear

Cause:

- This browser probably already has `mystudyfriend_profile`.

Fix in browser console:

```js
localStorage.removeItem("mystudyfriend_profile")
location.reload()
```

### Archive does not unlock

Check:

1. At least one course is selected.
2. The browser console has no JavaScript error.
3. `localStorage.getItem("mystudyfriend_profile")` returns a JSON string after clicking `Enter archive`.

### Returning user still sees onboarding

Check:

1. Open browser console.
2. Run:

```js
localStorage.getItem("mystudyfriend_profile")
```

If it returns `null`, the profile was not saved or localStorage was cleared.

### Switch profile does not work

Expected flow:

1. Click `Switch profile`.
2. Onboarding opens again.
3. Choose Jamie or Alex.
4. Click `Enter archive`.
5. Banner updates.

If the banner does not update, check the stored profile:

```js
JSON.parse(localStorage.getItem("mystudyfriend_profile"))
```

### Message posting fails after onboarding

Onboarding and posting use different localStorage keys.

Onboarding key:

```text
mystudyfriend_profile
```

Posting anonymous label key:

```text
demo_user_id
```

Check the Network tab for `POST /api/messages`.

The request should still include:

```json
{
  "locationId": 47,
  "body": "message text",
  "demoUserId": "some-browser-id"
}
```

## Verification Checklist

Run:

```bash
npm run lint
npm run build
```

Manual checks:

1. Clear `localStorage`.
2. Open `/desk/47`.
3. Confirm onboarding appears.
4. Choose Alex.
5. Confirm archive unlocks.
6. Confirm banner shows `Personalised for Alex · COMP2521 · MATH1081`.
7. Refresh page.
8. Confirm onboarding is skipped.
9. Click `Switch profile`.
10. Choose Jamie.
11. Confirm banner shows `Personalised for Jamie · FINS1613 · ECON1101`.
12. Open Incognito.
13. Confirm onboarding appears again.
14. Post a safe message after onboarding.
15. Confirm the message appears after refresh.

## Latest Local Verification

Commands:

```bash
npm run lint
npm run build
```

Result:

- Both passed.

Health check:

```text
GET /api/health
```

Important result:

```json
{
  "ok": true,
  "checkpoint": "hours-7-12",
  "desk47Messages": {
    "source": "supabase",
    "count": 30
  }
}
```

Server HTML check for `/desk/47`:

```json
{
  "HasCheckingProfile": true,
  "HasServerRenderedArchive": false,
  "HasServerRenderedOnboarding": false,
  "HasDeskQr": false,
  "HasQrCode": false,
  "HasLocalhost": false
}
```

What this means:

- The server sends the safe loading state first.
- The archive is not shown before the browser checks `localStorage`.
- The page still does not show QR/debug URL content.

Posting API check:

```json
{
  "message": {
    "body": "Hour 7-12 API verification: posting still works after onboarding changes.",
    "pseudonym": "Desk-47 Owl",
    "author_label": "Desk-47 Owl"
  }
}
```

What this means:

- The message API still works after onboarding changes.
- Stable anonymous labels still work.

Browser interaction note:

- A Playwright package check was attempted, but this machine did not expose the temporary Playwright package to the test file without installing it into the repo.
- Do the final click-through manually in a normal browser and Incognito using the checklist above.

## Next Step

Continue to Hours 12-18 only after:

- onboarding passes locally
- profile switching works
- message posting still works
- deployed `/desk/47` has the required Vercel env vars

The next checkpoint is profile-based reordering.
