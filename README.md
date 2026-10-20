# Mushafly for Android

A native Android Quran reader built with React Native, Expo and TypeScript. It
is the mobile companion to the [Mushafly web reader](https://github.com/cubecodefowad/Mushafly)
and keeps the same source-faithful data, editorial light/dark themes and
Tajweed rules. It is a real React Native app — not a WebView around the site.

The app ships with the complete Quran and 30 translation datasets across 17
languages — English, Indonesian, Urdu, Arabic commentary, French, Spanish,
German, Turkish, Bengali, Persian, Russian, Malay, Hindi, Portuguese, Swedish,
Italian and Swahili — inside a bundled SQLite database. Reading, search,
bookmarks, settings and every reference page work with no network connection.
Only recitation audio and external links need the internet.

## Requirements

- Node.js 24 or newer (the data scripts use the built-in `node:sqlite` and
  import TypeScript directly).
- npm 10+.
- An Android device or emulator for hands-on testing.
- Either a free Expo account (for cloud EAS builds) **or** Android Studio with
  JDK 17 and the Android SDK (for a local build).

## Run it

```bash
npm install
npm start            # Expo dev server
npm run android      # open on a connected device / emulator
```

`npm start` prints a QR code for Expo Go. Expo Go does not include every native
module this app uses, so a development build is recommended for full testing:

```bash
npx expo run:android   # local, needs the Android SDK
# or
npx eas build --platform android --profile development
```

## Verify it

```bash
npm run typecheck      # strict TypeScript
npm run data:validate  # database hash, counts, Tajweed, sajdah, font coverage
npm test               # unit + component + data integration tests
npm run verify         # all of the above
npx expo export --platform android   # production JS bundle + assets
```

The database checks are release-blocking, not smoke tests. See
[`docs/verification.md`](docs/verification.md) for what each check covers and
what has not been verified.

## Build an installable APK

### CI-built APK (already produced)

[`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) verifies
the data, types and tests, prebuilds the native project and builds a release APK
on every push to `main` (or from **Actions → Android APK → Run workflow**).

An APK for commit `7768b67` was built successfully:

- Run: <https://github.com/cubecodefowad/Mushafly-Android/actions/runs/39307503501>
- Artifact: **mushafly-apk** (44 MB zip, containing `mushafly.apk`), downloadable
  from the run page while the artifact is retained.
- Signing: the CI release build uses the generated debug keystore. It installs
  on a phone for testing, but it is **not** a Play Store signing identity.

Download the artifact, unzip it, and install `mushafly.apk` using the steps
below.

### EAS build

The `preview` profile in [`eas.json`](eas.json) is configured for APK output
(`distribution: internal`, `buildType: apk`), not an AAB.

```bash
npm install -g eas-cli        # or use npx eas-cli
eas login
eas init                      # links this directory to an EAS project
eas build --platform android --profile preview
```

When the build finishes, EAS prints a download URL for the `.apk`. You can also
open the build page and download it from there.

For a **local** build (no EAS account), install the Android SDK and JDK 17, then:

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

A release keystore is required for a store-ready build. EAS manages one for you;
for local builds follow the
[Expo signing guide](https://docs.expo.dev/app-signing/local-credentials/).
`android/` is generated and not committed.

An Android App Bundle for Google Play uses the `production` profile:

```bash
eas build --platform android --profile production   # buildType: app-bundle
```

## Install the APK on a phone

1. Copy the `.apk` to the phone (USB, cloud drive, or `adb install app.apk`).
2. Open it in the phone's file manager.
3. Allow "Install unknown apps" for that file manager when Android asks.
4. Install and open **Mushafly**.

To rebuild after changing code, repeat the EAS build command and install the new
APK; bookmarks and reading progress are preserved because the app data is keyed
by the application id `com.mushafly.android`.

## Data provenance

Everything the reader displays comes from the pinned runtime tree of
`semarketir/quranjson`, imported once into `assets/data/quran.db`.

| Asset | Value |
| --- | --- |
| Source | <https://github.com/semarketir/quranjson> |
| Commit | `7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98` |
| Source license | MIT |
| Runtime tree | `public/quran` (copied from the Mushafly web repository) |
| Database | `assets/data/quran.db`, 61.5 MiB, SHA-256 `27f4cb2c…416c984b` |
| Arabic font | Amiri Quran, `assets/fonts/AmiriQuran-Regular.ttf`, OFL |
| Audio | Streamed from the same pinned commit on `raw.githubusercontent.com` |

The full record, including input file count and known issues in the upstream
annotation, is in [`data/source-lock.json`](data/source-lock.json).

### Rebuilding the database

```bash
# with the Mushafly web checkout next to this directory
npm run data:build

# or point at it explicitly
MUSHAFLY_WEB_ROOT=/path/to/Mushafly npm run data:build

# deliberate re-pin after reviewing a new source commit
npm run data:build -- --update-lock
npm run data:validate
```

The importer copies every Arabic and translation string byte for byte from the
web runtime tree, reading all 30 datasets from `public/quran/translation`. It
derives one Arabic search column with documented normalization; the displayed
Arabic is never normalized, trimmed of diacritics, or rewritten. The database
includes 6,348 Arabic rows (6,236 numbered verses plus 112 Bismillah rows),
187,304 translation rows, 60,841 Tajweed ranges, 15 sajdah references and 6,348
audio URLs. Dataset keys are listed in `scripts/import-quran-data.mjs`; add one
there and rerun the import to bundle another edition.

### Sajdah and Quranic marks

The prostration sign (U+06E9) is part of the source Quranic text, not an icon.
`has_sajdah` is derived from that character during import, and the database
validator fails if the two ever disagree. The reader therefore cannot lose the
mark unless the source text itself changes.

In addition to the inline character, a verse of prostration shows a labelled
**Sajdah** badge next to its number. [`docs/verification.md`](docs/verification.md)
records the investigation of the web reader's missing-mark report, the desktop
and 390px pixel checks, and why the mobile rendering is different.

## Translations and Tajweed

The website carries all 68 Tanzil/quranjson datasets. This app bundles 30 of
them so the download stays reasonable while every major reading language is
available offline. The picker in Settings groups them by language and is
searchable by language, translator or edition: it shows the short edition name,
translator and source, and the reader reloads in place without losing its
position.

Search matches the Arabic source and the selected translation dataset. Matching
is diacritic-insensitive for Arabic and works in every bundled script, including
Bengali, Urdu, Persian and Russian; it is case- and accent-insensitive for Latin
text.

Tajweed colours are drawn from the dataset's own ranges, but a colour run is
only allowed to begin at a word edge or after a letter that does not join
forward. React Native's Android text engine shapes each nested text run on its
own, so a run that begins inside a word disconnects the Arabic letters. The
reader therefore colours the whole span the annotation touches rather than
breaking the word, never alters the Arabic, and the validator checks every verse
for the invariant. Where the upstream annotation is missing, out of bounds or
overlapping (147 verses in this pin), the verse is shown as plain text and
labelled; the app does not guess.

## Project structure

```
src/app/              Expo Router screens ((tabs), surah/[number], tajweed, about, terms, privacy)
src/components/       UI, Quran rows, audio bar, sheets
src/features/quran/   repository, Tajweed, normalization, signs, hooks
src/features/search/  full-dataset search hook
src/features/bookmarks/ and settings/  persisted user state
src/features/audio/   one expo-audio player, queue and lifecycle
src/data/             asset database opening and generated source metadata
src/database/         user database and repository (bookmarks, position, settings)
scripts/              deterministic import, validation, icon generation
tests/                unit, component and data-integration suites
data/                 pinned source lock
assets/               font, database, icons, splash
```

## Accuracy and reporting

The Quranic text is bundled from the pinned source and validated mechanically.
That proves fidelity to the source; it does not independently prove the source
is religiously correct. High-risk cases (Bismillah rows, the sajdah verses and
the one known U+FEFF artifact at 1:1) are listed in
[`docs/verification.md`](docs/verification.md).

If you find a possible discrepancy, write to **hello@mushafly.com** or open an
issue at <https://github.com/cubecodefowad/Mushafly-Android/issues>. Please say
whether the concern is about the Quranic text, a translation, the recitation or
the interface.

## Known limitations

- The APK was built in GitHub Actions, not on the machine used to write the
  code (which has no Android SDK, JDK or EAS login). It has not yet been
  installed on a physical device by this project, so device-level behaviour is
  still unverified. The CI APK uses debug signing and is for testing only.
- Recitation audio is **streamed**, not bundled. Offline reading is complete;
  offline audio is not offered. Pressing play without a connection now shows an
explicit message and a retry action instead of an endless spinner, and a stream
that never loads fails after 12 seconds with the same kind of message.
- Tajweed colour follows the annotation at word-span level where a rule begins
  inside a joined word. This is deliberate: character-level nesting disconnects
  Arabic letters on Android's new architecture.
- 147 verses are intentionally rendered without Tajweed colour because the
  upstream annotation cannot be applied faithfully.
- Search covers Arabic and the selected translation. Transliteration is not part
  of the source, so it is not searchable.
- 30 of the website's 68 translation datasets are bundled. The remaining
  editions can be added by extending the dataset list and rebuilding the
  database; they are not downloaded at runtime.
- The app has not yet been through a manual side-by-side comparison with a
  printed Mushaf, nor a performance pass on a low-end physical device.
