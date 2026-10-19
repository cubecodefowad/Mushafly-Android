/**
 * Deterministic Quran data import.
 *
 * Reads the pinned runtime tree from the Mushafly web application
 * (`public/quran/`), validates every record against its documented schema, and
 * writes a single read-only SQLite database for the Android app.
 *
 * The importer never edits Quranic text. It copies each source string exactly,
 * keeping diacritics, Quranic annotation signs and the one known U+FEFF
 * artifact. Search normalization is stored in separate columns and is never
 * used by the reader.
 *
 * Usage:
 *   node --disable-warning=ExperimentalWarning scripts/import-quran-data.mjs
 *   MUSHAFLY_WEB_ROOT=/path/to/Mushafly npm run data:build
 *   npm run data:build -- --update-lock   # deliberate source re-pin
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { renderTajweed } from "../src/features/quran/tajweed.ts";
import { normalize } from "../src/features/quran/normalize.ts";
import { TAJWEED_RULES } from "../src/features/quran/tajweed-rules.ts";
import { SAJDAH_VERSES } from "../src/features/quran/text-marks.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const WEB_ROOT = path.resolve(process.env.MUSHAFLY_WEB_ROOT ?? path.join(ROOT, ".."));
const DATA_ROOT = path.join(WEB_ROOT, "public", "quran");
const DB_PATH = path.join(ROOT, "assets", "data", "quran.db");
const LOCK_PATH = path.join(ROOT, "data", "source-lock.json");
const GENERATED_PATH = path.join(ROOT, "src", "data", "generated", "source.ts");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "AmiriQuran-Regular.ttf");
const UPDATE_LOCK = process.argv.includes("--update-lock");

const KNOWN_RULES = new Set(Object.keys(TAJWEED_RULES));
const SAJDAH_CHAR = "\u06e9";
const EXPECTED_SAJDAH = SAJDAH_VERSES.map((entry) => `${entry.surah}:${entry.verse}`);
const pad3 = (value) => String(value).padStart(3, "0");

function fail(message) {
  throw new Error(`[data:build] ${message}`);
}

function readJson(relativePath) {
  const file = path.join(DATA_ROOT, relativePath);
  if (!fs.existsSync(file)) fail(`Missing source file ${relativePath}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const manifest = readJson("manifest.json");
const metadata = readJson("metadata.json");
const juz = readJson("juz.json");

if (!Array.isArray(metadata) || metadata.length !== 114) {
  fail(`Expected 114 surah metadata records, found ${metadata?.length}`);
}
if (manifest.counts.surahs !== 114 || manifest.counts.verses !== 6236) {
  fail("The pinned manifest does not describe 114 surahs and 6,236 numbered verses.");
}
if (manifest.counts.arabicEntries !== 6348 || manifest.counts.bismillahVerses !== 112) {
  fail("The pinned manifest's Arabic row counts are not the expected 6,348 / 112.");
}

const expectedSajdah = [...EXPECTED_SAJDAH].sort();
const computedSajdah = [];
const computedOutOfBounds = new Set();
const computedOverlap = new Set();
const bomVerses = [];
let rawTajweedRanges = 0;
let unavailableTajweed = 0;
let audioEntries = 0;
let translationRows = { en: 0, id: 0, ar: 0 };
let arabicRows = 0;

const audioBase = `https://raw.githubusercontent.com/semarketir/quranjson/${manifest.commit}/source/audio`;
const surahs = [];

for (const meta of metadata) {
  const number = Number(meta.index);
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    fail(`Bad surah index ${String(meta.index)}`);
  }
  if (surahs.length + 1 !== number) fail(`Surah metadata is out of order at ${meta.index}`);

  const file = pad3(number);
  const arabic = readJson(`surah/${file}.json`);
  const en = readJson(`translation/en/${file}.json`);
  const id = readJson(`translation/id/${file}.json`);
  const ar = readJson(`translation/ar/${file}.json`);
  const tajweed = readJson(`tajweed/${file}.json`);
  const audio = readJson(`audio/${file}/index.json`);

  if (arabic.count !== meta.count) {
    fail(`Surah ${number}: Arabic count ${arabic.count} != metadata ${meta.count}`);
  }
  if (en.count !== meta.count || id.count !== meta.count || ar.count !== meta.count) {
    fail(`Surah ${number}: a translation count disagrees with metadata ${meta.count}`);
  }

  const numberedKeys = Array.from({ length: meta.count }, (_, index) => `verse_${index + 1}`);
  const expectedHasBismillah = number !== 1 && number !== 9;
  const hasBismillah = typeof arabic.verse.verse_0 === "string";
  if (hasBismillah !== expectedHasBismillah) {
    fail(
      `Surah ${number}: Bismillah row is ${hasBismillah ? "present" : "absent"}, expected ${
        expectedHasBismillah ? "present" : "absent"
      }`,
    );
  }
  const arabicKeys = Object.keys(arabic.verse).sort();
  const expectedArabicKeys = [...numberedKeys, ...(hasBismillah ? ["verse_0"] : [])].sort();
  if (JSON.stringify(arabicKeys) !== JSON.stringify(expectedArabicKeys)) {
    fail(`Surah ${number}: Arabic verse keys are incomplete or unexpected`);
  }

  for (const key of ["en", "id"]) {
    const source = key === "en" ? en : id;
    if (JSON.stringify(Object.keys(source.verse).sort()) !== JSON.stringify(expectedArabicKeys)) {
      fail(`Surah ${number}: ${key} translation keys do not align with Arabic keys`);
    }
  }
  if (ar.verse.verse_0 !== undefined) fail(`Surah ${number}: Arabic commentary unexpectedly has verse_0`);
  for (const key of numberedKeys) {
    if (typeof ar.verse[key] !== "string" || ar.verse[key].length === 0) {
      fail(`Surah ${number}: Arabic commentary is missing ${key}`);
    }
  }

  if (tajweed.count !== meta.count) {
    fail(`Surah ${number}: Tajweed count ${tajweed.count} != metadata ${meta.count}`);
  }
  const audioKeys = Object.keys(audio.verse).sort();
  if (JSON.stringify(audioKeys) !== JSON.stringify(expectedArabicKeys)) {
    fail(`Surah ${number}: audio keys do not align with Arabic keys`);
  }

  const verseRows = [];
  for (const key of [...(hasBismillah ? ["verse_0"] : []), ...numberedKeys]) {
    const verseNumber = key === "verse_0" ? 0 : Number(key.slice("verse_".length));
    const arabicText = arabic.verse[key];
    if (typeof arabicText !== "string" || arabicText.length === 0) {
      fail(`Surah ${number}: Arabic ${key} is missing or empty`);
    }
    arabicRows++;

    for (const [lang, source] of [
      ["en", en.verse[key]],
      ["id", id.verse[key]],
    ]) {
      if (typeof source !== "string" || source.length === 0) {
        fail(`Surah ${number}: ${lang} translation ${key} is missing or empty`);
      }
      translationRows[lang]++;
    }
    const commentary = verseNumber === 0 ? null : ar.verse[key];
    if (verseNumber > 0) translationRows.ar++;

    if (arabicText.startsWith("\ufeff")) bomVerses.push(`${number}:${key}`);
    if (arabicText.includes(SAJDAH_CHAR)) computedSajdah.push(`${number}:${verseNumber}`);

    const ranges = tajweed.verse[key];
    if (!Array.isArray(ranges)) fail(`Surah ${number}: ${key} has no Tajweed annotation array`);
    rawTajweedRanges += ranges.length;
    const rendered = renderTajweed(arabicText, ranges, { knownRules: KNOWN_RULES });
    if (rendered.segments.map((segment) => segment.text).join("") !== arabicText) {
      fail(`Surah ${number}:${verseNumber}: Tajweed segments do not reproduce the source string`);
    }
    if (rendered.status === "unavailable") {
      unavailableTajweed++;
      if (rendered.reason === "out-of-bounds") computedOutOfBounds.add(`${number}:${key}`);
      if (rendered.reason === "overlap") computedOverlap.add(`${number}:${key}`);
      if (rendered.reason !== "out-of-bounds" && rendered.reason !== "overlap") {
        fail(`Surah ${number}:${verseNumber}: unexpected Tajweed rejection ${rendered.reason}`);
      }
    }

    const audioEntry = audio.verse[key];
    if (!audioEntry || typeof audioEntry.file !== "string") {
      fail(`Surah ${number}: ${key} has no audio index entry`);
    }
    const expectedFile = `${pad3(verseNumber)}.mp3`;
    if (audioEntry.file !== expectedFile) {
      fail(
        `Surah ${number}: ${key} audio file ${audioEntry.file} does not match ${expectedFile}`,
      );
    }
    if (!Number.isInteger(audioEntry.size) || audioEntry.size <= 0) {
      fail(`Surah ${number}: ${key} audio size is invalid`);
    }
    audioEntries++;

    verseRows.push({
      surah: number,
      verse: verseNumber,
      arabic: arabicText,
      arabicSearch: normalize(arabicText),
      en: en.verse[key],
      enSearch: normalize(en.verse[key]),
      id: id.verse[key],
      idSearch: normalize(id.verse[key]),
      ar: commentary,
      arSearch: commentary ? normalize(commentary) : null,
      tajweed: JSON.stringify(ranges),
      hasSajdah: arabicText.includes(SAJDAH_CHAR) ? 1 : 0,
      audioFile: audioEntry.file,
      audioUrl: `${audioBase}/${file}/${encodeURIComponent(audioEntry.file)}`,
      audioSize: audioEntry.size,
    });
  }

  surahs.push({
    meta: {
      number,
      name: meta.title,
      arabicName: meta.titleAr,
      verseCount: meta.count,
      place: meta.place,
      type: meta.type,
      bismillah: hasBismillah,
      juz: Array.isArray(meta.juz) ? meta.juz : [],
    },
    verses: verseRows,
  });
}

computedSajdah.sort();
if (JSON.stringify(computedSajdah) !== JSON.stringify(expectedSajdah)) {
  fail(
    `Sajdah references differ from the verified list.\ncomputed: ${computedSajdah.join(
      ", ",
    )}\nexpected: ${expectedSajdah.join(", ")}`,
  );
}
if (computedSajdah.length !== 15) fail(`Expected 15 sajdah verses, found ${computedSajdah.length}`);
if (arabicRows !== manifest.counts.arabicEntries) {
  fail(`Arabic row total ${arabicRows} != manifest ${manifest.counts.arabicEntries}`);
}
if (translationRows.en !== 6348 || translationRows.id !== 6348 || translationRows.ar !== 6236) {
  fail(`Translation totals are ${JSON.stringify(translationRows)}, expected 6348/6348/6236`);
}
if (rawTajweedRanges !== manifest.counts.tajweedSegments) {
  fail(
    `Tajweed range total ${rawTajweedRanges} != manifest ${manifest.counts.tajweedSegments}`,
  );
}
if (audioEntries !== manifest.counts.arabicEntries) {
  fail(`Audio entry total ${audioEntries} != manifest ${manifest.counts.arabicEntries}`);
}
if (bomVerses.length !== 1 || bomVerses[0] !== "1:verse_1") {
  fail(`Expected exactly one BOM artifact at 1:1, found ${bomVerses.join(", ")}`);
}

const knownOutOfBounds = new Set(
  (manifest.knownIssues?.tajweedOutOfBounds ?? []).map((entry) => entry.replace(/:out-of-bounds$/, "")),
);
const knownOverlap = new Set(
  (manifest.knownIssues?.tajweedOverlapping ?? []).map((entry) => entry.replace(/:overlap$/, "")),
);
if (computedOutOfBounds.size !== knownOutOfBounds.size) {
  fail(`Tajweed out-of-bounds verses ${computedOutOfBounds.size} != pinned ${knownOutOfBounds.size}`);
}
for (const ref of computedOutOfBounds) {
  if (!knownOutOfBounds.has(ref)) fail(`Unpinned Tajweed out-of-bounds verse: ${ref}`);
}
if (computedOverlap.size !== knownOverlap.size) {
  fail(`Tajweed overlapping verses ${computedOverlap.size} != pinned ${knownOverlap.size}`);
}
for (const ref of computedOverlap) {
  if (!knownOverlap.has(ref)) fail(`Unpinned Tajweed overlap verse: ${ref}`);
}
if (unavailableTajweed !== computedOutOfBounds.size + computedOverlap.size) {
  fail(
    `Tajweed unavailable total ${unavailableTajweed} != out-of-bounds + overlap (${
      computedOutOfBounds.size + computedOverlap.size
    })`,
  );
}

// Hash the exact inputs used, so a future run can prove drift rather than guess.
const inputFiles = ["manifest.json", "metadata.json", "juz.json"];
for (const surah of surahs) {
  const file = pad3(surah.meta.number);
  inputFiles.push(
    `surah/${file}.json`,
    `translation/en/${file}.json`,
    `translation/id/${file}.json`,
    `translation/ar/${file}.json`,
    `tajweed/${file}.json`,
    `audio/${file}/index.json`,
  );
}
inputFiles.sort();
const treeHash = crypto.createHash("sha256");
let inputBytes = 0;
for (const relative of inputFiles) {
  const file = path.join(DATA_ROOT, relative);
  const buffer = fs.readFileSync(file);
  inputBytes += buffer.length;
  treeHash.update(relative);
  treeHash.update("\0");
  treeHash.update(crypto.createHash("sha256").update(buffer).digest("hex"));
  treeHash.update("\0");
}
const inputTreeHash = treeHash.digest("hex");
const fontSha256 = sha256File(FONT_PATH);

if (manifest.commit !== "7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98") {
  fail(`Unexpected source commit ${manifest.commit}; review before re-pinning.`);
}
if (manifest.repository !== "https://github.com/semarketir/quranjson") {
  fail(`Unexpected source repository ${manifest.repository}`);
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const tempDb = `${DB_PATH}.tmp-${process.pid}`;
if (fs.existsSync(tempDb)) fs.unlinkSync(tempDb);

const db = new DatabaseSync(tempDb);
db.exec(`
  PRAGMA journal_mode = DELETE;
  PRAGMA page_size = 4096;
  PRAGMA user_version = 1;
  CREATE TABLE meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  ) WITHOUT ROWID;
  CREATE TABLE surahs (
    number INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    arabic_name TEXT NOT NULL,
    verse_count INTEGER NOT NULL,
    place TEXT NOT NULL,
    type TEXT NOT NULL,
    bismillah INTEGER NOT NULL,
    juz_json TEXT NOT NULL
  );
  CREATE TABLE verses (
    surah INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    arabic TEXT NOT NULL,
    arabic_search TEXT NOT NULL,
    en TEXT NOT NULL,
    en_search TEXT NOT NULL,
    id TEXT NOT NULL,
    id_search TEXT NOT NULL,
    ar TEXT,
    ar_search TEXT,
    tajweed_json TEXT NOT NULL,
    has_sajdah INTEGER NOT NULL,
    audio_file TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    audio_size INTEGER NOT NULL,
    PRIMARY KEY (surah, verse)
  );
  CREATE INDEX verses_surah ON verses(surah);
`);

const insertMeta = db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)");
const insertSurah = db.prepare(`
  INSERT INTO surahs (number, name, arabic_name, verse_count, place, type, bismillah, juz_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertVerse = db.prepare(`
  INSERT INTO verses (
    surah, verse, arabic, arabic_search, en, en_search, id, id_search,
    ar, ar_search, tajweed_json, has_sajdah, audio_file, audio_url, audio_size
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec("BEGIN IMMEDIATE");
try {
  for (const surah of surahs) {
    const { meta } = surah;
    insertSurah.run(
      meta.number,
      meta.name,
      meta.arabicName,
      meta.verseCount,
      meta.place,
      meta.type,
      meta.bismillah ? 1 : 0,
      JSON.stringify(meta.juz),
    );
    for (const verse of surah.verses) {
      insertVerse.run(
        verse.surah,
        verse.verse,
        verse.arabic,
        verse.arabicSearch,
        verse.en,
        verse.enSearch,
        verse.id,
        verse.idSearch,
        verse.ar,
        verse.arSearch,
        verse.tajweed,
        verse.hasSajdah,
        verse.audioFile,
        verse.audioUrl,
        verse.audioSize,
      );
    }
  }

  const metaRows = {
    schemaVersion: "1",
    sourceRepository: manifest.repository,
    sourceCommit: manifest.commit,
    sourceLicense: manifest.license,
    generatedAt: new Date().toISOString(),
    inputTreeHash,
    arabicRows: String(arabicRows),
    numberedVerses: String(manifest.counts.verses),
    translationRows: JSON.stringify(translationRows),
    tajweedRanges: String(rawTajweedRanges),
    tajweedUnavailable: String(unavailableTajweed),
    sajdahCount: String(computedSajdah.length),
    audioEntries: String(audioEntries),
    audioReciter: manifest.audio.reciter,
    audioSource: manifest.audio.source,
    audioLicenseUrl: manifest.audio.licenseUrl,
    audioBitrate: manifest.audio.bitrate ?? "",
    translationsJson: JSON.stringify(manifest.translations),
    fontSha256,
  };
  for (const [key, value] of Object.entries(metaRows)) insertMeta.run(key, String(value));
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  db.close();
  fs.rmSync(tempDb, { force: true });
  throw error;
}

// Verify the finished file before it can replace the committed database.
const checks = [
  ["surahs", "SELECT COUNT(*) AS n FROM surahs", 114],
  ["verses", "SELECT COUNT(*) AS n FROM verses", 6348],
  ["numbered verses", "SELECT COUNT(*) AS n FROM verses WHERE verse > 0", 6236],
  ["sajdah", "SELECT COUNT(*) AS n FROM verses WHERE has_sajdah = 1", 15],
  ["bismillah", "SELECT COUNT(*) AS n FROM verses WHERE verse = 0", 112],
];
for (const [label, sql, expected] of checks) {
  const actual = Number(db.prepare(sql).get().n);
  if (actual !== expected) fail(`Post-build check failed: ${label} ${actual} != ${expected}`);
}
const roundTrip = db
  .prepare("SELECT surah, verse, arabic, en, id, ar, tajweed_json, has_sajdah FROM verses")
  .all();
const expectedRows = surahs.flatMap((surah) => surah.verses);
if (roundTrip.length !== expectedRows.length) fail("Post-build row count changed while writing.");
for (let index = 0; index < expectedRows.length; index++) {
  const source = expectedRows[index];
  const stored = roundTrip[index];
  if (
    stored.surah !== source.surah ||
    stored.verse !== source.verse ||
    stored.arabic !== source.arabic ||
    stored.en !== source.en ||
    stored.id !== source.id ||
    stored.ar !== source.ar ||
    stored.tajweed_json !== source.tajweed ||
    stored.has_sajdah !== source.hasSajdah
  ) {
    fail(`Post-build round-trip mismatch at ${source.surah}:${source.verse}`);
  }
}

db.close();
fs.rmSync(DB_PATH, { force: true });
fs.renameSync(tempDb, DB_PATH);

const dbSha256 = sha256File(DB_PATH);
const dbBytes = fs.statSync(DB_PATH).size;
const dataVersion = dbSha256.slice(0, 16);
const lock = {
  schemaVersion: 1,
  source: {
    repository: manifest.repository,
    commit: manifest.commit,
    license: manifest.license,
    runtimeTree: "public/quran",
    manifestSha256: sha256File(path.join(DATA_ROOT, "manifest.json")),
  },
  input: {
    files: inputFiles.length,
    bytes: inputBytes,
    treeSha256: inputTreeHash,
  },
  output: {
    database: "assets/data/quran.db",
    databaseSha256: dbSha256,
    databaseBytes: dbBytes,
    dataVersion,
  },
  font: {
    file: "assets/fonts/AmiriQuran-Regular.ttf",
    sha256: fontSha256,
  },
  counts: {
    surahs: surahs.length,
    arabicRows,
    numberedVerses: manifest.counts.verses,
    translationRows,
    tajweedRanges: rawTajweedRanges,
    tajweedUnavailable: unavailableTajweed,
    sajdahVerses: computedSajdah.length,
    audioEntries,
  },
  knownIssues: {
    tajweedOutOfBounds: [...computedOutOfBounds].sort(),
    tajweedOverlapping: [...computedOverlap].sort(),
    bomStrings: bomVerses,
  },
};

let existingLock = null;
if (fs.existsSync(LOCK_PATH)) {
  try {
    existingLock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
  } catch {
    fail("Existing data/source-lock.json is not valid JSON.");
  }
}
if (existingLock) {
  const comparable = (value) => {
    const copy = JSON.parse(JSON.stringify(value));
    delete copy.output?.databaseBytes;
    return JSON.stringify(copy);
  };
  if (!UPDATE_LOCK && comparable(existingLock) !== comparable(lock)) {
    fail(
      "The imported data does not match data/source-lock.json. " +
        "Review the change, then rerun with --update-lock.",
    );
  }
}
fs.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);

const sourceTs = `// Generated by scripts/import-quran-data.mjs. Do not edit by hand.
import type { SourceInfo } from "../../types/quran";

export const DATA_VERSION = ${JSON.stringify(dataVersion)};
export const DATA_SHA256 = ${JSON.stringify(dbSha256)};
export const SOURCE_INFO: SourceInfo = ${JSON.stringify(
  {
    repository: manifest.repository,
    commit: manifest.commit,
    license: manifest.license,
    translations: manifest.translations,
    audio: {
      reciter: manifest.audio.reciter,
      source: manifest.audio.source,
      licenseUrl: manifest.audio.licenseUrl,
      bitrate: manifest.audio.bitrate,
    },
    counts: {
      surahs: manifest.counts.surahs,
      verses: manifest.counts.verses,
      arabicEntries: manifest.counts.arabicEntries,
      translationRows: manifest.counts.translationRows,
      tajweedSegments: manifest.counts.tajweedSegments,
      bismillahVerses: manifest.counts.bismillahVerses,
    },
  },
  null,
  2,
)};
export const DATA_LOCK = ${JSON.stringify(lock, null, 2)};
`;
fs.mkdirSync(path.dirname(GENERATED_PATH), { recursive: true });
fs.writeFileSync(GENERATED_PATH, sourceTs);

console.log(
  [
    "Imported Quran data from the pinned source.",
    `  repository  ${manifest.repository}`,
    `  commit      ${manifest.commit}`,
    `  surahs      ${surahs.length}`,
    `  rows        ${arabicRows} (${manifest.counts.verses} numbered + 112 Bismillah)`,
    `  sajdah      ${computedSajdah.length} verified references`,
    `  tajweed     ${rawTajweedRanges} ranges, ${unavailableTajweed} verses rendered plain`,
    `  database    ${(dbBytes / 1024 / 1024).toFixed(2)} MiB, sha256 ${dbSha256.slice(0, 16)}…`,
  ].join("\n"),
);
