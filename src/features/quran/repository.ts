import type { SQLiteBindValue } from "expo-sqlite";
import { gunzipSync, strFromU8 } from "fflate";
import { renderTajweed, type RawTajweedRange } from "./tajweed";
import { TAJWEED_RULES } from "./tajweed-rules";
import { excerptFor, normalize, normalizeForSearch } from "./normalize";
import type {
  AudioReference,
  SearchMode,
  SearchResult,
  Surah,
  SurahMeta,
  TranslationLanguage,
  Verse,
} from "../../types/quran";

/** The read-only surface of expo-sqlite used by these queries. */
export type QuranDatabase = {
  getFirstAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T[]>;
};

const KNOWN_RULES = new Set(Object.keys(TAJWEED_RULES));

type SurahRow = {
  number: number;
  name: string;
  arabic_name: string;
  verse_count: number;
  place: string;
  type: string;
  bismillah: number;
  juz_json: string;
};

type VerseRow = {
  surah: number;
  verse: number;
  arabic: string;
  tajweed_json: string;
  has_sajdah: number;
  audio_file: string;
  audio_url: string;
  audio_size: number;
};

/** surah → verse → text, decoded from one dataset payload. */
type TranslationDataset = Map<number, Map<number, string>>;

const surahCache = new WeakMap<QuranDatabase, SurahMeta[]>();
const translationDatasetCache = new WeakMap<QuranDatabase, Map<string, TranslationDataset>>();
const translationIndexCache = new WeakMap<
  QuranDatabase,
  Map<string, TranslationIndexEntry[]>
>();
const arabicTextCache = new WeakMap<QuranDatabase, Map<string, string>>();

/**
 * A decoded dataset is several megabytes, so only the recent ones are kept.
 * Without a bound, tapping through the picker would retain every edition.
 */
const MAX_CACHED_DATASETS = 2;

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > MAX_CACHED_DATASETS) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return value;
}

type TranslationIndexEntry = {
  surah: number;
  verse: number;
  text: string;
  search: string;
};

/**
 * Reads and unpacks one dataset. Translations are stored as a gzipped JSON
 * payload per dataset, so all 68 editions fit in the committed database; a
 * dataset is only decompressed when it is selected, and then cached for the
 * lifetime of the database handle.
 */
async function loadTranslationDataset(
  db: QuranDatabase,
  dataset: TranslationLanguage,
): Promise<TranslationDataset> {
  let byDataset = translationDatasetCache.get(db);
  if (!byDataset) {
    byDataset = new Map();
    translationDatasetCache.set(db, byDataset);
  }
  const cached = byDataset.get(dataset);
  if (cached) return remember(byDataset, dataset, cached);

  const row = await db.getFirstAsync<{ payload: Uint8Array | ArrayBuffer }>(
    "SELECT payload FROM translation_datasets WHERE dataset = ?",
    dataset,
  );
  const decoded: TranslationDataset = new Map();
  if (row?.payload) {
    const bytes =
      row.payload instanceof Uint8Array ? row.payload : new Uint8Array(row.payload);
    const parsed = JSON.parse(strFromU8(gunzipSync(bytes))) as Record<
      string,
      Record<string, string>
    >;
    for (const [surah, bucket] of Object.entries(parsed)) {
      const verses = new Map<number, string>();
      for (const [verse, text] of Object.entries(bucket)) {
        verses.set(Number(verse), text);
      }
      decoded.set(Number(surah), verses);
    }
  }
  return remember(byDataset, dataset, decoded);
}

function toMeta(row: SurahRow): SurahMeta {
  let juz: SurahMeta["juz"] = [];
  try {
    const parsed = JSON.parse(row.juz_json);
    if (Array.isArray(parsed)) juz = parsed;
  } catch {
    juz = [];
  }
  return {
    number: row.number,
    name: row.name,
    arabicName: row.arabic_name,
    verseCount: row.verse_count,
    place: row.place,
    type: row.type,
    bismillah: row.bismillah === 1,
    juz,
  };
}

function audioFor(row: VerseRow): { audio: AudioReference | null; reason?: string } {
  if (!row.audio_file || !row.audio_url || !row.audio_size) {
    return { audio: null, reason: "The source has no recitation file for this verse." };
  }
  return {
    audio: {
      file: row.audio_file,
      url: row.audio_url,
      size: row.audio_size,
    },
  };
}

function toVerse(
  row: VerseRow,
  translation: string | null,
  language: TranslationLanguage,
): Verse {
  let ranges: RawTajweedRange[] | undefined;
  try {
    const parsed = JSON.parse(row.tajweed_json);
    ranges = Array.isArray(parsed) ? (parsed as RawTajweedRange[]) : undefined;
  } catch {
    ranges = undefined;
  }

  const { audio, reason } = audioFor(row);
  const tajweed = renderTajweed(row.arabic, ranges, { knownRules: KNOWN_RULES });

  return {
    surahNumber: row.surah,
    number: row.verse,
    key: `verse_${row.verse}`,
    arabic: row.arabic,
    translation,
    translationLanguage: language,
    tajweed,
    hasSajdah: row.has_sajdah === 1,
    audio,
    ...(reason ? { audioUnavailableReason: reason } : {}),
  };
}

export async function listSurahs(db: QuranDatabase): Promise<SurahMeta[]> {
  const cached = surahCache.get(db);
  if (cached) return cached;
  const rows = await db.getAllAsync<SurahRow>(
    `SELECT number, name, arabic_name, verse_count, place, type, bismillah, juz_json
     FROM surahs ORDER BY number`,
  );
  if (rows.length !== 114) {
    throw new Error(`The Quran database returned ${rows.length} surahs instead of 114.`);
  }
  const metas = rows.map(toMeta);
  surahCache.set(db, metas);
  return metas;
}

export async function getSurahMeta(
  db: QuranDatabase,
  number: number,
): Promise<SurahMeta | null> {
  if (!Number.isInteger(number) || number < 1 || number > 114) return null;
  const all = await listSurahs(db);
  return all.find((entry) => entry.number === number) ?? null;
}


export async function getSurah(
  db: QuranDatabase,
  number: number,
  language: TranslationLanguage,
): Promise<Surah> {
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    throw new Error(`Invalid surah number: ${String(number)}`);
  }
  const all = await listSurahs(db);
  const meta = all[number - 1];
  if (!meta) throw new Error(`Surah ${number} is missing from the database.`);

  const rows = await db.getAllAsync<VerseRow>(
    `SELECT surah, verse, arabic, tajweed_json, has_sajdah,
            audio_file, audio_url, audio_size
     FROM verses WHERE surah = ? ORDER BY verse`,
    number,
  );
  if (rows.length === 0) {
    throw new Error(`Surah ${number} has no verse rows in the database.`);
  }

  const translations = (await loadTranslationDataset(db, language)).get(number);
  const items = rows.map((row) =>
    toVerse(row, translations?.get(row.verse) ?? null, language),
  );
  const bismillah = items.find((verse) => verse.number === 0) ?? null;
  const verses = items.filter((verse) => verse.number > 0);
  const expected = meta.verseCount + (meta.bismillah ? 1 : 0);
  if (items.length !== expected) {
    throw new Error(
      `Surah ${number} contains ${items.length} rows; the source metadata requires ${expected}.`,
    );
  }
  if (verses.length !== meta.verseCount) {
    throw new Error(
      `Surah ${number} contains ${verses.length} numbered verses; expected ${meta.verseCount}.`,
    );
  }

  const rules = new Set<string>();
  let unavailableTajweedCount = 0;
  for (const verse of items) {
    if (verse.tajweed.status === "ok") {
      for (const rule of verse.tajweed.appliedRules) rules.add(rule);
    } else if (verse.tajweed.status === "unavailable") {
      unavailableTajweedCount++;
    }
  }

  return {
    meta,
    bismillah,
    verses,
    prev: number > 1 ? all[number - 2] : null,
    next: number < 114 ? all[number] : null,
    tajweedRules: [...rules].sort(),
    unavailableTajweedCount,
  };
}

export async function getVerse(
  db: QuranDatabase,
  surahNumber: number,
  verseNumber: number,
  language: TranslationLanguage,
): Promise<Verse | null> {
  const row = await db.getFirstAsync<VerseRow>(
    `SELECT surah, verse, arabic, tajweed_json, has_sajdah,
            audio_file, audio_url, audio_size
     FROM verses WHERE surah = ? AND verse = ?`,
    surahNumber,
    verseNumber,
  );
  if (!row) return null;
  const dataset = await loadTranslationDataset(db, language);
  return toVerse(row, dataset.get(surahNumber)?.get(verseNumber) ?? null, language);
}

export type VersePreview = {
  surahNumber: number;
  verseNumber: number;
  surahName: string;
  surahArabicName: string;
  arabic: string;
  translation: string | null;
  hasSajdah: boolean;
};

export async function getVersePreview(
  db: QuranDatabase,
  surahNumber: number,
  verseNumber: number,
  language: TranslationLanguage,
): Promise<VersePreview | null> {
  const row = await db.getFirstAsync<{
    surah: number;
    verse: number;
    arabic: string;
    has_sajdah: number;
    name: string;
    arabic_name: string;
  }>(
    `SELECT v.surah, v.verse, v.arabic, v.has_sajdah, s.name, s.arabic_name
     FROM verses v
     JOIN surahs s ON s.number = v.surah
     WHERE v.surah = ? AND v.verse = ?`,
    surahNumber,
    verseNumber,
  );
  if (!row) return null;
  const dataset = await loadTranslationDataset(db, language);
  return {
    surahNumber: row.surah,
    verseNumber: row.verse,
    surahName: row.name,
    surahArabicName: row.arabic_name,
    arabic: row.arabic,
    translation: dataset.get(surahNumber)?.get(verseNumber) ?? null,
    hasSajdah: row.has_sajdah === 1,
  };
}

export async function getVersePreviews(
  db: QuranDatabase,
  references: Array<{ surahNumber: number; verseNumber: number }>,
  language: TranslationLanguage,
): Promise<Map<string, VersePreview>> {
  const entries = await Promise.all(
    references.map(async (reference) => {
      const preview = await getVersePreview(
        db,
        reference.surahNumber,
        reference.verseNumber,
        language,
      );
      if (!preview) return null;
      const key = `${reference.surahNumber}:${reference.verseNumber}`;
      return [key, preview] as [string, VersePreview];
    }),
  );
  return new Map(
    entries.filter((entry): entry is [string, VersePreview] => entry !== null),
  );
}

async function translationIndex(
  db: QuranDatabase,
  dataset: TranslationLanguage,
): Promise<TranslationIndexEntry[]> {
  let byDataset = translationIndexCache.get(db);
  if (!byDataset) {
    byDataset = new Map();
    translationIndexCache.set(db, byDataset);
  }
  const cached = byDataset.get(dataset);
  if (cached) return remember(byDataset, dataset, cached);
  const translations = await loadTranslationDataset(db, dataset);
  const index: TranslationIndexEntry[] = [];
  for (const [surah, verses] of translations) {
    for (const [verse, text] of verses) {
      index.push({ surah, verse, text, search: normalizeForSearch(text) });
    }
  }
  index.sort((a, b) => (a.surah === b.surah ? a.verse - b.verse : a.surah - b.surah));
  return remember(byDataset, dataset, index);
}

export async function searchVerses(
  db: QuranDatabase,
  rawQuery: string,
  language: TranslationLanguage,
  mode: SearchMode = "all",
  limit = 120,
): Promise<SearchResult[]> {
  const arabicQuery = normalize(rawQuery.trim());
  const textQuery = normalizeForSearch(rawQuery.trim());
  if (textQuery.length < 2 && arabicQuery.length < 2) return [];

  const metas = await listSurahs(db);
  const results = new Map<string, SearchResult>();

  if (mode !== "translation" && arabicQuery.length >= 2) {
    const rows = await db.getAllAsync<{ surah: number; verse: number; arabic: string }>(
      `SELECT surah, verse, arabic FROM verses
       WHERE verse > 0 AND instr(arabic_search, ?) > 0
       ORDER BY surah, verse
       LIMIT ?`,
      arabicQuery,
      limit,
    );
    for (const row of rows) {
      const meta = metas[row.surah - 1];
      results.set(`${row.surah}:${row.verse}`, {
        surahNumber: row.surah,
        verseNumber: row.verse,
        surahName: meta?.name ?? `Surah ${row.surah}`,
        surahArabicName: meta?.arabicName ?? "",
        arabic: excerptFor(row.arabic, arabicQuery, 190),
        translation: null,
        matchField: "arabic",
      });
    }
  }

  if (mode !== "arabic" && textQuery.length >= 2) {
    const index = await translationIndex(db, language);
    let arabicText = arabicTextCache.get(db);
    if (!arabicText) {
      const rows = await db.getAllAsync<{ surah: number; verse: number; arabic: string }>(
        `SELECT surah, verse, arabic FROM verses`,
      );
      arabicText = new Map(
        rows.map((row) => [`${row.surah}:${row.verse}`, row.arabic]),
      );
      arabicTextCache.set(db, arabicText);
    }
    for (const entry of index) {
      // The unnumbered Bismillah row is part of the page header, not a
      // searchable verse reference.
      if (entry.verse === 0) continue;
      if (!entry.search.includes(textQuery)) continue;
      const key = `${entry.surah}:${entry.verse}`;
      const existing = results.get(key);
      if (existing) {
        existing.translation = excerptFor(entry.text, textQuery, 190);
        continue;
      }
      const meta = metas[entry.surah - 1];
      results.set(key, {
        surahNumber: entry.surah,
        verseNumber: entry.verse,
        surahName: meta?.name ?? `Surah ${entry.surah}`,
        surahArabicName: meta?.arabicName ?? "",
        arabic: excerptFor(arabicText.get(key) ?? "", "", 190),
        translation: excerptFor(entry.text, textQuery, 190),
        matchField: "translation",
      });
    }
  }

  return [...results.values()]
    .sort((a, b) =>
      a.surahNumber === b.surahNumber
        ? a.verseNumber - b.verseNumber
        : a.surahNumber - b.surahNumber,
    )
    .slice(0, limit);
}

export async function getSajdahReferences(
  db: QuranDatabase,
): Promise<Array<{ surahNumber: number; verseNumber: number }>> {
  const rows = await db.getAllAsync<{ surah: number; verse: number }>(
    "SELECT surah, verse FROM verses WHERE has_sajdah = 1 ORDER BY surah, verse",
  );
  return rows.map((row) => ({ surahNumber: row.surah, verseNumber: row.verse }));
}
