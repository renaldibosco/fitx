# FitX

A professional gym-training app for Android — personalised programs, a fast workout logger with rest timer, and progress tracking. Works fully offline; all data stays on the phone.

## Features

- **Personal program** — built from your goal (fat loss, recomposition, muscle, strength), level, equipment (full gym / home dumbbells / bodyweight) and days per week (2–6): Full Body, Upper/Lower, PPL.
- **Workout logger** — previous performance per set, one-tap fill, warm-up sets, auto rest timer with sound, vibration and a notification when the screen is off, notes, replace/reorder exercises.
- **Progressive overload** — tells you when to add weight based on your last session.
- **84 exercises** with coaching cues, plus your own custom exercises and routines.
- **Progress** — body-weight trend, workouts and volume per week, sets per muscle, personal records (est. 1RM), full history.
- **Tools** — 1RM calculator with % table, plate calculator, calories & macros (Mifflin-St Jeor), interval timer for boxing/HIIT rounds.
- **Backup & restore** to a JSON file; kg or lb.

## Install

Grab `FitX.apk` from the latest [release](https://github.com/renaldibosco/fitx/releases/latest) and open it on your phone. New releases install over the old one and keep your data.

## Build

Every push to `main` builds a signed APK with GitHub Actions and publishes it as a release.

Local: `npm ci && npx cap sync android && cd android && ./gradlew assembleRelease`.
Web preview: `npm run serve` then open http://localhost:8080.

Stack: vanilla JS (ES modules) + Capacitor 7. The signing key in `android/app/` can be moved to repository secrets (`FITX_KEYSTORE`, `FITX_STORE_PASSWORD`, `FITX_KEY_ALIAS`, `FITX_KEY_PASSWORD`).
