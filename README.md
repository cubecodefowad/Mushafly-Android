# Mushafly for Android

A native Android Quran reader built with React Native, Expo and TypeScript. It
is the mobile companion to the [Mushafly web reader](https://github.com/cubecodefowad/Mushafly)
and keeps the same source-faithful data, editorial light/dark themes and
Tajweed rules. It is a real React Native app — not a WebView around the site.

The app ships with the complete Quran, English / Indonesian translations and an
Arabic commentary inside a bundled SQLite database, so reading, search,
bookmarks and settings work with no network connection. Only recitation audio
and the issue-reporting link need the internet.

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
| Database | `assets/data/quran.db`, SHA-256 `8cdec835…a968aa2297` |
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

The importer copies every Arabic, translation and commentary string byte for
byte. It derives two separate search columns with documented normalization; the
displayed Arabic is never normalized, trimmed of diacritics, or rewritten. The
database includes 6,348 Arabic rows (6,236 numbered verses plus 112 Bismillah
rows), 60,841 Tajweed ranges, 15 sajdah references and 6,348 audio URLs.

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

- English: Talal Itani (Tanzil.net)
- Indonesian: Indonesian Ministry of Religious Affairs (Tanzil.net)
- Arabic commentary: Tafsir al-Muyassar (King Fahad Quran Complex)

Tajweed overlays colour source characters using the dataset's own ranges. Each
overlay is reconstructed from slices of the original string and is rejected if
the slices do not join back to it exactly, so switching Tajweed off cannot remove
a character or a diacritic. If the upstream annotation is missing, out of bounds
or overlapping (147 verses in this pin), that verse is shown as plain text and
labelled; the app does not guess.

## Project structure

```
src/app/              Expo Router screens ((tabs), surah/[number], search, about)
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

- **No APK has been built in this environment.** There is no Android SDK, JDK
  or EAS login on the machine used to write this code. The JavaScript bundle and
  every asset export successfully, but the APK itself must be produced with the
  commands above.
- Recitation audio is **streamed**, not bundled. Offline reading is complete;
  offline audio is not offered.
- 147 verses are intentionally rendered without Tajweed colour because the
  upstream annotation cannot be applied faithfully.
- Search covers Arabic and the selected translation. Transliteration is not part
  of the source, so it is not searchable.
- The app has not yet been through a manual side-by-side comparison with a
  printed Mushaf, nor a performance pass on a low-end physical device.
