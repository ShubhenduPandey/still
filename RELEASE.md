# Still release preparation

Status: build profiles prepared. No signed binaries, store records, or submissions have been created.

## Required owner details

- Apple Developer Program and Google Play Console account access.
- Expo account/project to own cloud builds.
- Public developer identity and support email.
- Permanent iOS bundle identifier and Android package name, chosen for the owner. These are deliberately not invented or registered yet.
- Public support and privacy-policy URLs, with an in-app privacy link.

## Build profiles

`eas.json` includes an internal preview profile and a production store profile with remote build-number management. Android submission starts on the internal testing track. Store upload and public release are separate steps.

After account ownership and identifiers are resolved, from the project directory:

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli build:configure
npx eas-cli build --platform all --profile production
```

Use the owner's account during setup and confirm the generated `extra.eas.projectId`, `ios.bundleIdentifier`, and `android.package`. Do not put account credentials or signing keys in source control. There is no account link or cloud project yet.

For Android device testing, the preview profile creates an installable APK. TestFlight uses a signed iOS store build.

## Before submission

- Test the signed builds on physical iPhone and Android devices, including sound, haptics, background pausing, resuming, screen readers, and session completion.
- Test iPad layouts because the app currently declares tablet support.
- Publish support and privacy pages after inserting the owner's real contact details; add the privacy link to the app.
- Confirm privacy declarations against the final bundled dependencies and behavior. The current source stores only preferences locally and implements no account, analytics, advertising, or health integration.
- Capture store screenshots from the actual native builds; prepare Google Play feature artwork and store metadata.
- Complete age/content ratings, Google Play Data safety and applicable health-app declarations, Apple App Privacy, and pricing as free.
- For a qualifying new Google personal account, finish the required closed test and apply for production access.
- Upload the first Android release manually in Play Console before relying on API submission.
- After testing and store review, select the public release in each console.

## Sources checked

- https://docs.expo.dev/build/setup/
- https://docs.expo.dev/deploy/submit-to-app-stores/
- https://docs.expo.dev/eas/json/
- https://developer.apple.com/app-store/review/guidelines/
- https://support.google.com/googleplay/android-developer/answer/14151465
