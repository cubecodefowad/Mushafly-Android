/**
 * The symbols that appear in the Uthmani text this app renders. They are
 * source characters, not interface icons: the reader displays them exactly as
 * the pinned dataset records them. Meanings follow the conventional Madani
 * Mushaf reading, as used by the Tanzil Uthmani text this data derives from.
 */
export type TextMarkKind = "pause" | "structure" | "prostration" | "orthographic";

/**
 * Optical offset in `em`, applied when the sign is shown on its own.
 *
 * The Uthmani signs are drawn to sit above a letter that is not present in a
 * key, so their ink floats at the height the font gives each glyph: a pause
 * mark near the cap height, a hizb divider near the baseline. These values
 * move each sign's ink to the centre of its key cell, and the x value centres
 * the ink rather than the (usually zero-width) advance box. They were measured
 * from the bundled Amiri Quran font; the same em values work at both key sizes.
 */
export type MarkOptical = { x: number; y: number };

export type TextMark = {
  glyph: string;
  name: string;
  arabic: string;
  /** One line, used in the reader's side key. */
  short: string;
  /** Fuller explanation, used on the reference page. */
  detail: string;
  kind: TextMarkKind;
  optical: MarkOptical;
};

export const TEXT_MARKS: TextMark[] = [
  {
    glyph: "\u06D6",
    optical: { x: -0.24, y: 0.94 },
    name: "Wasl awlā",
    arabic: "الوصل أولى",
    short: "Continue if you can",
    detail:
      "Continuing is preferred. Stopping is allowed, but it is the lesser choice.",
    kind: "pause",
  },
  {
    glyph: "\u06D7",
    optical: { x: -0.24, y: 0.96 },
    name: "Waqf awlā",
    arabic: "الوقف أولى",
    short: "Stop if you can",
    detail:
      "Stopping is preferred. Continuing is allowed, but it is the lesser choice.",
    kind: "pause",
  },
  {
    glyph: "\u06D8",
    optical: { x: -0.16, y: 0.83 },
    name: "Waqf lāzim",
    arabic: "الوقف اللازم",
    short: "Stop here",
    detail:
      "A stop is necessary here: running on would join two statements in a way that changes the meaning.",
    kind: "pause",
  },
  {
    glyph: "\u06D9",
    optical: { x: -0.15, y: 0.94 },
    name: "Lā waqf",
    arabic: "لا",
    short: "Do not stop",
    detail:
      "Do not stop at this point. The sentence carries straight on, and pausing here would break it.",
    kind: "pause",
  },
  {
    glyph: "\u06DA",
    optical: { x: -0.19, y: 0.93 },
    name: "Waqf jā'iz",
    arabic: "الوقف الجائز",
    short: "Stop or continue",
    detail:
      "An open choice: stopping and continuing are equally acceptable.",
    kind: "pause",
  },
  {
    glyph: "\u06DB",
    optical: { x: -0.18, y: 0.82 },
    name: "Mu'ānaqah",
    arabic: "المعانقة",
    short: "Stop at one, not both",
    detail:
      "These appear in pairs around a phrase. Stop at one of the two signs, never at both.",
    kind: "pause",
  },
  {
    glyph: "\u06DC",
    optical: { x: -0.25, y: 0.88 },
    name: "Saktah",
    arabic: "السكتة",
    short: "Pause without breathing",
    detail:
      "A brief silence with the breath held, then continue. It is shorter than a stop.",
    kind: "pause",
  },
  {
    glyph: "\u06DE",
    optical: { x: 0, y: -0.44 },
    name: "Rub' al-ḥizb",
    arabic: "ربع الحزب",
    short: "Quarter-hizb divider",
    detail:
      "A division of the text — one quarter of a hizb — not an instruction to pause or continue.",
    kind: "structure",
  },
  {
    glyph: "\u06E9",
    optical: { x: 0, y: -0.43 },
    name: "Sajdah",
    arabic: "سجدة التلاوة",
    short: "Verse of prostration",
    detail:
      "A verse of prostration (sajdat al-tilāwah). When reciting, a single prostration is recommended at this point. There are 15 in this text, listed on this page.",
    kind: "prostration",
  },
];

/**
 * The small superscript signs. They belong to the Uthmani spelling rather than
 * to the pause system, so they are described together instead of one by one.
 */
export type OrthographicMark = {
  /** Variants are shown side by side, each centred in its own cell. */
  glyphs: Array<{ glyph: string; optical: MarkOptical }>;
  name: string;
  detail: string;
};

export const ORTHOGRAPHIC_MARKS: OrthographicMark[] = [
  {
    glyphs: [
      { glyph: "\u06DF", optical: { x: -0.18, y: 0.34 } },
      { glyph: "\u06E0", optical: { x: -0.18, y: 0.39 } },
    ],
    name: "Small zero",
    detail:
      "Marks a letter that is written in the Uthmani spelling but not sounded when the verse is recited continuously.",
  },
  {
    glyphs: [
      // Unlike the zero-width signs, these have an advance; their advance box
      // is already centred, so only a hair of horizontal correction is needed.
      { glyph: "\u06E5", optical: { x: 0, y: -0.47 } },
      { glyph: "\u06E6", optical: { x: 0, y: -0.44 } },
    ],
    name: "Small waw and yeh",
    detail:
      "A written sign with no sound of its own; it belongs to the spelling of the word, not to the pause rules.",
  },
  {
    glyphs: [{ glyph: "\u06E2", optical: { x: -0.12, y: 0.37 } }],
    name: "Small meem",
    detail:
      "Placed above a noon or tanween to mark iqlab, where the sound becomes a meem.",
  },
];

/** The 15 verses marked with a sajdah in the pinned dataset. */
export const SAJDAH_VERSES: Array<{ surah: number; verse: number }> = [
  { surah: 7, verse: 206 },
  { surah: 13, verse: 15 },
  { surah: 16, verse: 50 },
  { surah: 17, verse: 109 },
  { surah: 19, verse: 58 },
  { surah: 22, verse: 18 },
  { surah: 22, verse: 77 },
  { surah: 25, verse: 60 },
  { surah: 27, verse: 26 },
  { surah: 32, verse: 15 },
  { surah: 38, verse: 24 },
  { surah: 41, verse: 38 },
  { surah: 53, verse: 62 },
  { surah: 84, verse: 21 },
  { surah: 96, verse: 19 },
];
