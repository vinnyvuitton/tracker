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
- Added exact 30-minute treadmill stages and server-scheduled push alerts that continue while another app is open.
- Added private AI-assisted meal estimation from notes, a photo, or both, with editable confirmation and manual fallback.

## Data safety

The access code is never committed to source control. It is stored as a Cloudflare Worker secret and entered once on each device. The browser keeps it locally on that device.

The OpenAI API key and private Web Push signing key are also encrypted Worker secrets. Meal requests use `store: false`; meal photos are not added to tracker storage unless the user explicitly turns on Keep this meal photo.

New progress photos are compressed in the browser and stored as separate private objects in Cloudflare KV. They are fetched through the authenticated Worker and are never assigned a public URL.

The Worker retains the 30 most recent prior tracker versions in KV. The Check-in screen also provides a private JSON backup download.

## Deployment order

1. Keep a copy of the existing KV export.
2. Set a strong `TRACKER_TOKEN` with `wrangler secret put TRACKER_TOKEN`.
3. Deploy the Worker and verify `/health`, unauthorized rejection, authenticated data load, save conflicts, and photo upload.
4. Deploy `index.html`, `styles.css`, `migration.js`, `app.js`, `manifest.webmanifest`, and `sw.js` to GitHub Pages.
5. Open the dashboard on the iPhone, enter the access code, and verify that the historical data migrates.
6. Test one harmless entry and one test photo.
7. Download a fresh backup.

Do not replace the live frontend before the protected Worker is deployed. The new frontend intentionally requires the protected API.
