# Vinny Workout 2.0

This is the protected replacement for the original tracker. The original live dashboard and its data remain untouched until this version is deployed and verified.

## What changed

- Replaced the old gym and cable-machine plan with the home dumbbell, adjustable bench, mat, and treadmill plan.
- Added all seven days, including two cardio days and one recovery day.
- Added calibration-week fields for actual load and reps.
- Added daily front, side, and back photo capture. Wednesday is labeled as the official weekly checkpoint.
- Added a one-tap weekly check-in summary for ChatGPT.
- Replaced timestamp week math with ISO calendar dates to avoid daylight-saving drift.
- Added a real web app manifest.
- Removed the unauthenticated AI proxy and public data access.
- Added bearer-token authentication, strict origin checks, version conflict detection, rolling backups, and private per-photo storage.
- Preserved automatic import of the original `mytracker` KV data.

## Workout 2.1 additions

- Added iPhone safe-area spacing and 16 px form controls so the installed app no longer overlaps the status bar or zooms when typing.
- Renamed the date-browsing tab to Daily and removed unreliable step entry.
- Blurred progress photos by default with temporary tap-to-reveal privacy.
- Added exact FEIERDUN plate instructions using the confirmed four 2.5, 3.5, 4.5, and 6.5 lb plates and an approximately 1 lb handle-and-collars assumption.
- Added prior-load guidance and Too light / Just right / Too heavy progression feedback.
- Added exact guided treadmill stages and server-scheduled push alerts that continue while another app is open. September 9 is a recovery day; the training journey begins with Thursday's Upper B workout. Saturday remains 30 minutes until feedback guides progression.
- Replaced constant treadmill polling with delayed alert messages created only when a session starts. Ordinary changes are grouped before syncing, and backups rotate through fixed slots without scanning KV after every save.
- Meal estimates now use the free Workers AI allowance. Meal notes and photos are saved before analysis; unavailable estimates remain in a global Daily queue and retry after the allowance resets.
- Added private AI-assisted meal estimation from notes, a photo, or both, with editable confirmation and manual fallback.

## Workout 2.3 additions

- Replaced automatic quick repeats with intentional favorites organized as Breakfast, Lunch, Dinner, or Snack.
- Added most-used and most-recent favorite ranking, one-tap usual portions, adjustable portions, and favorite management.
- Expanded meal estimates and daily totals with fiber, saturated fat, added sugar, and sodium when the available information supports them; unknown details remain blank.
- Added an authenticated Help me decide meal coach that uses the current day's remaining targets, supports follow-up questions and optional photos, and never logs food without confirmation.
- Added a review-and-log handoff from meal advice without running a second AI estimate.
- Made every bottom navigation tap return its view to the top.
- Locked the dashboard background behind every popup while preserving scrolling inside longer popup content on iPhone.

## Data safety

The access code is never committed to source control. It is stored as a Cloudflare Worker secret and entered once on each device. The browser keeps it locally on that device.

The private Web Push signing key is stored as an encrypted Worker secret. Meal estimates run through the Worker's private Cloudflare AI binding; the dashboard access code is never sent to the model.

Progress and meal photos are compressed in the browser and stored as separate private objects. They are fetched through the authenticated Worker and are never assigned a public URL. A meal photo is kept temporarily while an estimate is pending, then deleted after confirmation unless Keep this meal photo is selected.

The Worker retains 30 rotating prior tracker versions in KV. The Check-in screen also provides a private JSON backup download.

## Deployment order

1. Keep a copy of the existing KV export.
2. Set a strong `TRACKER_TOKEN` with `wrangler secret put TRACKER_TOKEN`.
3. Create the alert queue, deploy the Worker, and verify `/health`, unauthorized rejection, authenticated data load, save conflicts, photo upload, meal estimation, and one scheduled alert.
4. Deploy `index.html`, `styles.css`, `migration.js`, `app.js`, `manifest.webmanifest`, and `sw.js` to GitHub Pages.
5. Open the dashboard on the iPhone, enter the access code, and verify that the historical data migrates.
6. Test one harmless entry and one test photo.
7. Download a fresh backup.

Do not replace the live frontend before the protected Worker is deployed. The new frontend intentionally requires the protected API.
