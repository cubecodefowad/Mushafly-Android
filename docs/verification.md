# Verification record

This file records what was actually checked, how, and what remains unverified.
It is not a claim that the Quran has been independently verified.

## How to reproduce

```bash
npm install
npm run typecheck
npm run data:validate
npm test
npx expo export --platform android
```

`npm run data:validate` needs Node 20+ for `node:sqlite`. It reports
`source diff skipped` when the Mushafly web checkout is not present next to this
directory; the SHA-256 of the shipped database is still checked. With the web
checkout present, all 6,348 rows are compared byte for byte against
`public/quran`.

## Results (last run in this workspace)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | pass, no errors |
| `npm run data:validate` | pass — pinned hash, 114 surahs, 6,236 numbered verses, 112 Bismillah rows, 30 translation datasets / 187,304 rows, 15 sajdah refs, 60,841 Tajweed ranges, 147 intentionally plain verses, 1,446-glyph font covers every displayed Arabic code point, 6,348 rows byte-compared with the source |
| `npm test` | pass — 10 suites, 63 tests |
| `npx expo export --platform android` | pass — Hermes bundle 4.7 MB, 61.5 MB database asset present in the export |
| `npx expo-doctor` | pass — 20/20 checks |
| APK build | pass in GitHub Actions (run [39474437023](https://github.com/cubecodefowad/Mushafly-Android/actions/runs/39474437023), commit `244f5e7`, version 1.1.0): artifact `mushafly-apk`, 60 MB zip, release APK built with the generated debug keystore; every step including `npm run verify` succeeded |
| APK on a device | **not run** — no device or emulator was available to this workspace |

The export is not a substitute for a device test, and neither is the APK build.
Both prove that the project compiles and packages; only an install-and-read pass
can show that the database copy, audio session and layout behave on Android. The
CI build also signs the release with the debug keystore, so it is a test
artefact rather than a Play-ready binary.

## Test coverage

Unit tests:

- `normalize` removes diacritics and Quranic annotation signs only in the search
  copy, folds letter variants, folds English diacritics and punctuation,
  collapses whitespace, and maps each normalized character back to its source
  index. Excerpts are slices of the original string.
- `renderTajweed` returns segments that join back to the source exactly for
  valid ranges; it refuses unknown rules, overlaps, out-of-bounds ranges and
  missing annotations instead of guessing; it accounts for the single U+FEFF
  artifact without deleting it; the sajdah character survives at the end of
  7:206. It also proves that no colour run starts on a combining mark attached
  to a letter, or inside a joined word, and that a rule annotated on a
  superscript alef keeps that alef with its base letter.
- `normalizeForSearch` keeps the letters of every bundled script (Urdu, Bengali,
  Cyrillic, Japanese) and still folds case, accents, Arabic diacritics and
  punctuation.
- `canStreamAudio` treats only an explicit disconnection or unreachable network
  as offline, allows a play attempt when reachability is unknown, and the
  offline/timeout messages always explain the failure.
- `parseSettings` clamps sizes, rejects bad themes and translations, ignores
  unknown keys and falls back to defaults for malformed storage.
- Reference helpers produce stable `surah:verse` keys and safe timestamps.
- The sign reference documents the sajdah sign, and `SAJDAH_VERSES` is exactly
  the 15 unique, ordered references.

Component tests (`@testing-library/react-native`):

- `ArabicText` renders the exact source string with Tajweed off and on, keeps
  U+06E9 at the end, paints a source rule with its palette colour and underline,
  and sets `writingDirection: rtl`, right alignment, the Amiri Quran family and
  `accessibilityLanguage: "ar"`.
- `SajdahBadge` shows the U+06E9 glyph plus the word "Sajdah" and an accessible
  label.

Integration tests:

- Runs the release data validator as a child process, so `npm test` cannot pass
  against a stale, corrupt or unpublished database.
- Opens the shipped SQLite file with Node's own binding and runs the real
  repository queries through the same `getFirstAsync`/`getAllAsync` shape
  `expo-sqlite` provides. It checks all 114 surahs, the Bismillah row, verse
  order, 7:206's sajdah flag and character, Tajweed segments joining back to the
  source for seven surahs, the single BOM at 1:1, 15 SQL-derived sajdah
  references, Arabic and English search excerpts, bookmark previews, and the
  pinned audio URL.
- It also walks all 6,236 verses and asserts the shaping invariant on the real
  annotation: no colour run may start on a mark attached to a letter or inside a
  joined word. It confirms the selected dataset is read from the translations
  table (`en.sahih` differs from `en`, Urdu returns Urdu), that only `en` and
  `id` carry Bismillah rows, and that search follows the selected dataset in
  both English and Urdu.

Not covered by automated tests: the SQLite copy-on-first-launch path, audio
lifecycle on a real device, gesture and scroll performance, safe areas and
cutouts, and Android process death. These need an emulator or phone.

## Reader fixes in 1.1.0

| Report | Cause found | Fix | Evidence |
| --- | --- | --- | --- |
| Ayat only play online; offline shows an endless loading state | The player was replaced with a remote URL and waited for `isLoaded` forever; there was no connectivity check and no timeout, and the error surface only existed once a track had been set | Check connectivity before loading, show the track immediately, set an explicit offline message, and fail a stream that never loads after 12 seconds; play/retry re-checks the connection | `connectivity.test.ts` covers the rule and both messages; `AudioProvider` sets the error and clears `loading`; the audio bar shows the message and a Retry action |
| Arabic letters unconnected in places | React Native on Android shapes each nested `Text` run separately. Character-level Tajweed ranges (many begin on a diacritic or mid-word) split words into separate runs | Ranges are grouped into letter clusters and colour runs may only start at a word edge or after a letter that does not join forward; the whole touched span is coloured instead | Unit tests assert no run splits a cluster or starts in a joined word; the repository walk asserts the same across all 6,236 verses; the report's “translation is fine” observation matches the cause, since translations are single strings |
| Tajweed ranges do not align, so there are no colours | Same cause: ranges beginning on a combining mark were sliced apart, so the colour landed on a detached mark and looked absent; the 147 out-of-bounds verses were additionally shown plain | Attach every range to its letter cluster before choosing runs, and paint the cluster's whole span; the 147 unusable verses stay labelled and plain | `tajweed.test.ts` covers a rule annotated on a superscript alef; the all-verse walk checks cluster boundaries; `ArabicText.test.tsx` asserts the palette colour and underline are actually rendered |
| No scrolling while ayat play | Playback changed the track but nothing told the list to move | An effect follows `audio.current` and calls `scrollToIndex` for the playing verse (top for the Bismillah), with the existing `onScrollToIndexFailed` fallback | Code path in `surah/[number].tsx`; needs a device pass to judge feel |
| No separate Tajweed, search, About, ToS or privacy pages | Search and About existed but were not tabs, and there was no legal or Tajweed reference screen | Search is a tab with its own icon and is reachable from the reader header; Tajweed and marks, Terms of Service and Privacy Policy are separate screens linked from Home, Settings and About | TypeScript + Metro bundle include every route; copy was rewritten for the app's real storage and network behaviour |
| Search for ayat missing | The search screen existed but was buried behind a Home tile, and its text only described an English translation | Search is a dedicated tab, searches the selected dataset, names that dataset, and explains Arabic matching | Repository integration tests cover Arabic, English and Urdu searches |

## Sajdah investigation

The report carried over from the web app was "a sajdah mark does not appear".
The investigation traced the mark through the data, the fonts and both readers.

1. **Source data.** `semarketir/quranjson` at the pinned commit contains U+06E9
   (`۩`) in the Arabic string of exactly 15 verses. 7:206 ends with
   `…وَلَهُۥ يَسْجُدُونَ ۩` (space before the sign). No other verse contains it.
2. **Import.** `scripts/import-quran-data.mjs` copies the string unchanged and
   derives `has_sajdah` from the presence of U+06E9. The validator fails if the
   column and the character ever disagree, so a future import cannot silently
   lose the mark.
3. **Fonts.** The bundled `AmiriQuran-Regular.ttf` has a real glyph for U+06E9
   (advance 671/1000 em, ink from −408 to +740 units). The web WOFF2 subset has
   the same glyph. Font coverage was therefore not the cause.
4. **Web rendering.** A headless Chrome inspection of `/surah/7/` at 900 px and
   at 390 px found the character in the DOM, a client rect inside the page, and
   painted ink in that rect at 3× device scale. The web reader does paint the
   mark at the end of the verse; it has no badge and no textual indication, so
   the sign is easy to miss and the web app has no separate sajdah UI.
5. **Mobile rendering.** The reader displays the same source characters, plus a
   labelled Sajdah badge in the verse's meta row. The sign therefore has both its
   source position and a discoverable interface marker. It does not depend on
   colour alone, and it is not affected by the Tajweed toggle.

Conclusion: the data and the bundled fonts are sound; the web reader renders the
glyph but provides no persistent, labelled indicator. The mobile build addresses
that by deriving the badge from the source character itself, keeping the
character in the Arabic text, and guarding both cases in tests. A total absence
of the glyph could not be reproduced in the web app at the tested widths.

Manual check still required: compare the 15 sajdah positions and the 7:206
ending against a printed Madani Mushaf. The references are listed in
`src/features/quran/text-marks.ts`; 7:206 is the last verse of the surah.

## Data integrity

- Pinned source commit and database SHA-256 are recorded in
  `data/source-lock.json`; the validator recomputes the hash of the shipped file.
- Surah numbering is contiguous, verse sequences have no gaps, and every verse
  is within its surah's count.
- Translation, commentary and Tajweed records are aligned by the source's own
  `verse_N` keys; the importer fails on a count mismatch rather than shifting
  rows.
- Search columns are verified to be the output of `normalize()` applied to the
  stored source strings. They are never used for display.
- Audio file names and URLs are rebuilt from the pinned commit and checked for
  every row.
- The font is checked glyph by glyph against every Arabic code point in the
  database, including all nine pause/structure/prostration signs.

## Accuracy disclaimer

> We have taken great care to preserve the accuracy and integrity of the Quranic
> text and the translations presented in this application. The Quranic text and
> associated data are sourced from the project's documented sources, and we
> strive to display the content faithfully.
>
> Despite these efforts, errors or technical issues may occasionally occur. If
> you notice a possible discrepancy in the Quranic text, translation,
> recitation, or other content, please contact us so we can investigate it
> carefully. We appreciate your help in identifying potential issues and
> improving the application.

Contact: **hello@mushafly.com** (the web project's published address) or
<https://github.com/cubecodefowad/Mushafly-Android/issues>.

The text is shown in the app under **About → Accuracy and sources**, together
with the source commit, license and translation credits.

## Known limitations

- The APK was produced by CI, not by this workspace, and has not been installed
  on a device. Its signing identity is the debug keystore.
- Audio is streamed from the pinned source; the app does not claim offline
  recitation. An offline press now explains this instead of spinning.
- Tajweed colour is applied to the touched word span when a rule begins inside a
  joined word, because character-level runs disconnect Arabic letters on
  Android. The letters themselves are never changed.
- 147 verses have unusable upstream Tajweed annotation and are shown plain.
- The single U+FEFF at the start of 1:1 is preserved exactly as the source
  stores it. It has no visible width and no Quranic meaning.
- Device-level checks (startup time, scroll smoothness, memory, APK size,
  cutouts, audio interruptions) have not been performed.
- The app has not been compared side by side with a printed Mushaf by a
  qualified reviewer.
