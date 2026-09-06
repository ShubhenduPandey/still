# Still

A free breathing companion for iOS and Android, built with React Native, Expo SDK 57, and TypeScript. A web preview uses the same app code.

## Included in this first version

- Orb, Tide, Minimal Timer, Path, and Lungs, with live previews.
- Default rhythm: inhale 4 seconds, hold 0, exhale 6. Adjustable inhale/exhale from 1–20 seconds, hold from 0–20 seconds.
- Path uses three triangle sides when holding is enabled, or two circular arcs when hold is zero.
- Lungs fill during inhale, stay full during hold, and empty during exhale.
- Sessions from 1–30 minutes, pause/resume, early ending, and a completion screen.
- Light and dark themes, independently switchable chime and haptics.
- Preferences saved locally; no accounts, ads, analytics, server, or health permissions.
- Screen-reader phase announcements and a minimal timer when the device requests reduced motion.
- Screen stays awake during an active session. Leaving the foreground pauses the session; returning requires an explicit resume.

## Run

Use Node.js 22.13+ or 24 LTS, with npm.

```sh
npm install
npm start
```

Open the QR code in a compatible Expo Go client on an iPhone or Android phone connected to the same network. The installed SDK must match the Expo Go client. This is a development preview, not an App Store / Play Store installation.

On this computer dependencies are already installed. If npm is unavailable in the terminal, run:

```sh
node node_modules/expo/bin/cli start --lan
```

For a browser development preview:

```sh
npm run web
```

For the built local preview:

```sh
node node_modules/expo/bin/cli export --platform web
node scripts/preview.cjs
```

Open http://localhost:8081. The preview server binds only to this computer.

## Verification

```sh
npm run typecheck
npm test
node node_modules/expo/bin/cli export --platform ios --platform android --output-dir work/native-export
```

Tests cover phase boundaries, zero hold, fill levels, skipped frames, saved-setting validation, and countdown formatting. Native exports verify bundling, not execution on a physical phone.

## Before release

Test on real iOS and Android devices: phase timing, audio/silent mode, vibration support, interruptions, backgrounding, screen readers, large text, small screens, and battery use. Build signed native binaries using the eventual owner’s bundle identifiers and developer accounts. Store submission, name availability, and production signing are not configured yet. iOS local native builds require macOS/Xcode; cloud builds can be used from Windows.

Health integration is explicitly deferred to V2. No session history is stored yet. The session ends at its selected duration even if that falls partway through a breath cycle. Preferences auto-save as they change. The original synthesized chime can be regenerated with `node scripts/generate-chime.cjs`.

## Source

- `App.tsx`: screens, session clock, cues, and saved preferences.
- `src/breathing.ts`: deterministic timing and settings validation.
- `src/BreathVisual.tsx`: SVG breathing visuals.
- `src/theme.ts`: colors.
- `tests/breathing.test.ts`: timing tests.

Official references: [Expo SDK](https://docs.expo.dev/versions/latest/), [audio](https://docs.expo.dev/versions/latest/sdk/audio/), [haptics](https://docs.expo.dev/versions/latest/sdk/haptics/).
