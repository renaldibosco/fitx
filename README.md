# NrXFitz

A professional gym & fight-training app for Android — personalised programs, a fast workout logger, a tap-to-speak AI coach, animated form demos, Fight Mode and full progress tracking. Works offline; all data stays on the phone.

## Features

- **Personal program** — built from your goal (fat loss, recomposition, muscle, strength), level, equipment (full gym / home dumbbells / bodyweight) and days per week (2–6): Full Body, Upper/Lower, PPL.
- **Workout logger** — previous performance per set, one-tap fill, warm-up sets, auto rest timer with sound, vibration and a notification when the screen is off, notes, replace/reorder exercises.
- **Progressive overload** — tells you when to add weight based on your last session.
- **90 exercises** with coaching cues, plus your own custom exercises and routines.
- **Progress** — body-weight trend, workouts and volume per week, sets per muscle, personal records (est. 1RM), full history.
- **Tools** — 1RM calculator with % table, plate calculator, calories & macros (Mifflin-St Jeor), interval timer for boxing/HIIT rounds.
- **Backup & restore** to a JSON file; kg or lb.

- **NrX Coach** — tap the mic and ask any training doubt; spoken answers. Offline knowledge built in; add a Claude API key for full AI (English & Tamil).
- **Animated form demos** for every exercise.
- **Fight Mode** — boxing / Muay Thai rounds with bell, 10-second warning and spoken combos.
- **Smart training** — auto deload when you stall, warm-up generator, supersets, home equipment builder.
- **Habits** — water & protein trackers, cardio/steps log, body measurements, private progress photos, 21 achievements.
- **Workout reminders**, **Tamil UI**, **6 theme colours**, **home-screen widget**.

## Install

Grab `NrXFitz.apk` from the latest [release](https://github.com/renaldibosco/fitx/releases/latest) and open it on your phone. New releases install over the old one and keep your data.

## Build

Every push to `main` builds a signed APK with GitHub Actions and publishes it as a release.

Local: `npm ci && npx cap sync android && cd android && ./gradlew assembleRelease`.
Web preview: `npm run serve` then open http://localhost:8080.

Stack: vanilla JS (ES modules) + Capacitor 7. The signing key in `android/app/` can be moved to repository secrets (`FITX_KEYSTORE`, `FITX_STORE_PASSWORD`, `FITX_KEY_ALIAS`, `FITX_KEY_PASSWORD`).
