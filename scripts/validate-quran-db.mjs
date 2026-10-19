/**
 * Release-blocking data validation.
 *
 * This checks the shipped database itself, independent of the importer. It
 * verifies the pinned hash, every row's counts, search columns, Tajweed
 * alignment, sajdah references, audio mapping, and font coverage. When the web
 * source checkout is available it also compares every displayed string byte for
 * byte with that source.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { renderTajweed } from "../src/features/quran/tajweed.ts";
import { normalize } from "../src/features/quran/normalize.ts";
import { TAJWEED_RULES } from "../src/features/quran/tajweed-rules.ts";
import { SAJDAH_VERSES } from "../src/features/quran/text-marks.ts";

const require = createRequire(import.meta.url);
const fontkit = require("fontkit");

const ROOT = path.resolve(import.meta.dirname, "..");
const DB_PATH = path.join(ROOT, "assets", "data", "quran.db");
const LOCK_PATH = path.join(ROOT, "data", "source-lock.json");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "AmiriQuran-Regular.ttf");
const WEB_ROOT = path.resolve(process.env.MUSHAFLY_WEB_ROOT ?? path.join(ROOT, ".."));
const SOURCE_ROOT = path.join(WEB_ROOT, "public", "quran");
const HAS_SOURCE = fs.existsSync(SOURCE_ROOT);
const KNOWN_RULES = new Set(Object.keys(TAJWEED_RULES));
const SAJDAH_CHAR = "\u06e9";
const pad3 = (value) => String(value).padStart(3, "0");

function fail(message) {
  throw new Error(`[data:validate] ${message}`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

for (const file of [DB_PATH, LOCK_PATH, FONT_PATH]) {
  if (!fs.existsSync(file)) fail(`Missing required file ${path.relative(ROOT, file)}`);
}

const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
if (lock.source.repository !== "https://github.com/semarketir/quranjson") {
  fail(`Unexpected source repository ${lock.source.repository}`);
}
if (!/^[0-9a-f]{40}$/.test(lock.source.commit)) fail("Source commit is not a full SHA-1.");
if (sha256File(DB_PATH) !== lock.output.databaseSha256) {
  fail("assets/data/quran.db does not match the pinned SHA-256 in data/source-lock.json");
}
if (sha256File(FONT_PATH) !== lock.font.sha256) {
  fail("The bundled Arabic font does not match its pinned SHA-256");
}

const generated = fs.readFileSync(path.join(ROOT, "src", "data", "generated", "source.ts"), "utf8");
if (!generated.includes(lock.source.commit)) fail("Generated source metadata is not the pinned commit.");
if (!generated.includes(lock.output.dataVersion)) fail("Generated data version is stale.");

const db = new DatabaseSync(DB_PATH, { readOnly: true });
const meta = Object.fromEntries(
  db.prepare("SELECT key, value FROM meta").all().map((row) => [row.key, row.value]),
);
if (meta.schemaVersion !== "1") fail(`Unexpected schema version ${meta.schemaVersion}`);
if (meta.sourceCommit !== lock.source.commit) fail("Database source commit does not match the lock.");
if (meta.sourceRepository !== lock.source.repository) fail("Database source repository mismatch.");
if (meta.sourceLicense !== "MIT") fail(`Unexpected source license ${meta.sourceLicense}`);
if (Number(meta.arabicRows) !== 6348) fail(`Arabic rows ${meta.arabicRows} != 6348`);
if (Number(meta.numberedVerses) !== 6236) fail(`Numbered verses ${meta.numberedVerses} != 6236`);
if (Number(meta.tajweedRanges) !== 60841) fail(`Tajweed ranges ${meta.tajweedRanges} != 60841`);
if (Number(meta.sajdahCount) !== 15) fail(`Sajdah count ${meta.sajdahCount} != 15`);
if (Number(meta.audioEntries) !== 6348) fail(`Audio entries ${meta.audioEntries} != 6348`);

const integrity = db.prepare("PRAGMA quick_check").get();
if (Object.values(integrity)[0] !== "ok") fail(`SQLite quick_check failed: ${JSON.stringify(integrity)}`);

const counts = [
  ["surahs", "SELECT COUNT(*) AS n FROM surahs", 114],
  ["verses", "SELECT COUNT(*) AS n FROM verses", 6348],
  ["numbered", "SELECT COUNT(*) AS n FROM verses WHERE verse > 0", 6236],
  ["bismillah", "SELECT COUNT(*) AS n FROM verses WHERE verse = 0", 112],
  ["sajdah", "SELECT COUNT(*) AS n FROM verses WHERE has_sajdah = 1", 15],
];
for (const [label, sql, expected] of counts) {
  const actual = Number(db.prepare(sql).get().n);
  if (actual !== expected) fail(`Count ${label}: ${actual} != ${expected}`);
}

const surahs = db
  .prepare(
    "SELECT number, name, arabic_name, verse_count, place, type, bismillah, juz_json FROM surahs ORDER BY number",
  )
  .all();
if (surahs.length !== 114) fail(`Surah table has ${surahs.length} rows`);
for (let index = 0; index < surahs.length; index++) {
  const surah = surahs[index];
  if (surah.number !== index + 1) fail(`Surah numbering is not contiguous at ${index + 1}`);
  if (!surah.name || !surah.arabic_name) fail(`Surah ${surah.number} has no name`);
  if (!Number.isInteger(surah.verse_count) || surah.verse_count < 1) {
    fail(`Surah ${surah.number} has a bad verse count`);
  }
  if (surah.bismillah !== (surah.number === 1 || surah.number === 9 ? 0 : 1)) {
    fail(`Surah ${surah.number} has the wrong Bismillah convention`);
  }
  const juz = JSON.parse(surah.juz_json);
  if (!Array.isArray(juz) || juz.length === 0) fail(`Surah ${surah.number} has no juz metadata`);
}

const verses = db
  .prepare(
    `SELECT surah, verse, arabic, arabic_search, en, en_search, id, id_search,
            ar, ar_search, tajweed_json, has_sajdah, audio_file, audio_url, audio_size
     FROM verses ORDER BY surah, verse`,
  )
  .all();
if (verses.length !== 6348) fail(`Verse table has ${verses.length} rows`);

const sajdah = [];
let bom = [];
let unavailable = 0;
const audioBase = `https://raw.githubusercontent.com/semarketir/quranjson/${lock.source.commit}/source/audio`;
let currentSurah = -1;
let expectedVerse = 0;
let index = 0;

for (const row of verses) {
  while (index < surahs.length && row.surah > surahs[index].number) index++;
  const surah = surahs[row.surah - 1];
  if (!surah || surah.number !== row.surah) fail(`Verse ${row.surah}:${row.verse} has no surah row`);
  if (row.surah !== currentSurah) {
    currentSurah = row.surah;
    expectedVerse = surah.bismillah ? 0 : 1;
  }
  if (row.verse !== expectedVerse) {
    fail(`Surah ${row.surah} verse sequence breaks at ${row.verse}; expected ${expectedVerse}`);
  }
  expectedVerse++;
  if (row.verse > surah.verse_count) fail(`Surah ${row.surah} has a verse beyond its count`);

  if (typeof row.arabic !== "string" || row.arabic.length === 0) {
    fail(`Surah ${row.surah}:${row.verse} has empty Arabic text`);
  }
  if (row.arabic.startsWith("\ufeff")) bom.push(`${row.surah}:${row.verse}`);
  if (row.arabic.includes(SAJDAH_CHAR)) sajdah.push(`${row.surah}:${row.verse}`);
  if (row.has_sajdah !== (row.arabic.includes(SAJDAH_CHAR) ? 1 : 0)) {
    fail(`Surah ${row.surah}:${row.verse} sajdah column disagrees with the Arabic text`);
  }

  if (normalize(row.arabic) !== row.arabic_search) {
    fail(`Surah ${row.surah}:${row.verse} Arabic search column is not derived from the text`);
  }
  if (typeof row.en !== "string" || row.en.length === 0) {
    fail(`Surah ${row.surah}:${row.verse} has no English translation`);
  }
  if (normalize(row.en) !== row.en_search) {
    fail(`Surah ${row.surah}:${row.verse} English search column is not derived from the text`);
  }
  if (typeof row.id !== "string" || row.id.length === 0) {
    fail(`Surah ${row.surah}:${row.verse} has no Indonesian translation`);
  }
  if (normalize(row.id) !== row.id_search) {
    fail(`Surah ${row.surah}:${row.verse} Indonesian search column is not derived from the text`);
  }
  if (row.verse === 0) {
    if (row.ar !== null) fail(`Surah ${row.surah} Bismillah row has unexpected commentary`);
  } else if (typeof row.ar !== "string" || row.ar.length === 0) {
    fail(`Surah ${row.surah}:${row.verse} has no Arabic commentary`);
  }
  if (row.ar !== null && normalize(row.ar) !== row.ar_search) {
    fail(`Surah ${row.surah}:${row.verse} commentary search column is stale`);
  }

  const ranges = JSON.parse(row.tajweed_json);
  if (!Array.isArray(ranges)) fail(`Surah ${row.surah}:${row.verse} Tajweed is not an array`);
  for (const range of ranges) {
    if (
      !Number.isInteger(range.start) ||
      !Number.isInteger(range.end) ||
      start_guard(range) ||
      !KNOWN_RULES.has(range.rule)
    ) {
      fail(`Surah ${row.surah}:${row.verse} has a malformed Tajweed range`);
    }
  }
  const rendered = renderTajweed(row.arabic, ranges, { knownRules: KNOWN_RULES });
  if (rendered.segments.map((segment) => segment.text).join("") !== row.arabic) {
    fail(`Surah ${row.surah}:${row.verse} Tajweed rendering changes the source string`);
  }
  if (rendered.status === "unavailable") unavailable++;

  const expectedFile = `${pad3(row.verse)}.mp3`;
  if (row.audio_file !== expectedFile) {
    fail(`Surah ${row.surah}:${row.verse} audio file ${row.audio_file} != ${expectedFile}`);
  }
  const expectedUrl = `${audioBase}/${pad3(row.surah)}/${encodeURIComponent(expectedFile)}`;
  if (row.audio_url !== expectedUrl) {
    fail(`Surah ${row.surah}:${row.verse} audio URL is not the pinned source URL`);
  }
  if (!Number.isInteger(row.audio_size) || row.audio_size <= 0) {
    fail(`Surah ${row.surah}:${row.verse} audio size is invalid`);
  }
}

function start_guard(range) {
  return range.start < 0 || range.start >= range.end;
}

if (bom.length !== 1 || bom[0] !== "1:1") fail(`BOM artifacts: ${bom.join(", ")}`);
sajdah.sort();
const expectedSajdah = SAJDAH_VERSES.map((entry) => `${entry.surah}:${entry.verse}`).sort();
if (JSON.stringify(sajdah) !== JSON.stringify(expectedSajdah)) {
  fail(`Sajdah references changed.\n${sajdah.join(", ")}\n${expectedSajdah.join(", ")}`);
}
if (unavailable !== 147) fail(`Tajweed-unavailable verses ${unavailable} != pinned 147`);

// Every character the reader can display must exist in the bundled font. This
// is the check that prevents the sajdah sign (U+06E9) or another mark from
// silently falling back to a font that renders it as a box or nothing.
const font = fontkit.openSync(FONT_PATH);
const codepoints = new Set();
for (const row of verses) {
  for (const char of row.arabic) {
    const code = char.codePointAt(0);
    if (
      code !== 0xfeff &&
      ((code >= 0x0600 && code <= 0x06ff) ||
      (code >= 0x0750 && code <= 0x077f) ||
      (code >= 0x08a0 && code <= 0x08ff) ||
      (code >= 0xfb50 && code <= 0xfdff) ||
      (code >= 0xfe70 && code <= 0xfeff))
    ) {
      codepoints.add(code);
    }
  }
}
const missing = [...codepoints].filter((code) => !font.hasGlyphForCodePoint(code));
if (missing.length) {
  fail(
    `The bundled font is missing glyphs for: ${missing
      .map((code) => `U+${code.toString(16).toUpperCase()}`)
      .join(", ")}`,
  );
}
for (const required of [0x06d6, 0x06d7, 0x06d8, 0x06d9, 0x06da, 0x06db, 0x06dc, 0x06de, 0x06e9]) {
  if (!font.hasGlyphForCodePoint(required)) {
    fail(`The bundled font lacks required mark U+${required.toString(16).toUpperCase()}`);
  }
}

let sourceCompared = 0;
if (HAS_SOURCE) {
  const metadata = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, "metadata.json"), "utf8"));
  for (const sourceMeta of metadata) {
    const number = Number(sourceMeta.index);
    const file = pad3(number);
    const arabic = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, "surah", `${file}.json`), "utf8"));
    const en = JSON.parse(
      fs.readFileSync(path.join(SOURCE_ROOT, "translation", "en", `${file}.json`), "utf8"),
    );
    const id = JSON.parse(
      fs.readFileSync(path.join(SOURCE_ROOT, "translation", "id", `${file}.json`), "utf8"),
    );
    const ar = JSON.parse(
      fs.readFileSync(path.join(SOURCE_ROOT, "translation", "ar", `${file}.json`), "utf8"),
    );
    const tajweed = JSON.parse(
      fs.readFileSync(path.join(SOURCE_ROOT, "tajweed", `${file}.json`), "utf8"),
    );
    for (const row of verses.filter((entry) => entry.surah === number)) {
      const key = `verse_${row.verse}`;
      if (row.arabic !== arabic.verse[key]) fail(`Arabic drift at ${number}:${key}`);
      if (row.en !== en.verse[key]) fail(`English drift at ${number}:${key}`);
      if (row.id !== id.verse[key]) fail(`Indonesian drift at ${number}:${key}`);
      if (row.verse > 0 && row.ar !== ar.verse[key]) fail(`Commentary drift at ${number}:${key}`);
      if (row.tajweed_json !== JSON.stringify(tajweed.verse[key])) {
        fail(`Tajweed metadata drift at ${number}:${key}`);
      }
      sourceCompared++;
    }
  }
}

db.close();

console.log(
  [
    "Quran data validation passed.",
    `  source        ${lock.source.repository} @ ${lock.source.commit.slice(0, 7)}`,
    `  database      ${(lock.output.databaseBytes / 1024 / 1024).toFixed(2)} MiB, hash verified`,
    `  coverage      114 surahs, 6,236 numbered verses, 112 Bismillah rows`,
    `  sajdah        15 references, source character present`,
    `  tajweed       60,841 ranges, 147 verses intentionally plain`,
    `  font          ${font.numGlyphs} glyphs, all displayed Arabic code points covered`,
    HAS_SOURCE
      ? `  source diff   ${sourceCompared} rows byte-compared against ${path.relative(ROOT, SOURCE_ROOT)}`
      : "  source diff   skipped (source checkout not present; pinned DB hash checked)",
  ].join("\n"),
);
