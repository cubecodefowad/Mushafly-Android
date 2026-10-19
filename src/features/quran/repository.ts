import type { SQLiteBindValue } from "expo-sqlite";
import { renderTajweed, type RawTajweedRange } from "./tajweed";
import { TAJWEED_RULES } from "./tajweed-rules";
import { excerptFor, normalize } from "./normalize";
import type {
  AudioReference,
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
  en: string;
  id: string;
  ar: string | null;
  tajweed_json: string;
  has_sajdah: number;
  audio_file: string;
  audio_url: string;
  audio_size: number;
};

type SearchRow = VerseRow & {
  arabic_search: string;
  name: string;
  arabic_name: string;
};

const surahCache = new WeakMap<QuranDatabase, SurahMeta[]>();

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

function toVerse(row: VerseRow): Verse {
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
    translations: {
      en: row.en || null,
      id: row.id || null,
      ar: row.ar ?? null,
    },
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

export async function getSurah(db: QuranDatabase, number: number): Promise<Surah> {
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    throw new Error(`Invalid surah number: ${String(number)}`);
  }
  const all = await listSurahs(db);
  const meta = all[number - 1];
  if (!meta) throw new Error(`Surah ${number} is missing from the database.`);

  const rows = await db.getAllAsync<VerseRow>(
    `SELECT surah, verse, arabic, en, id, ar, tajweed_json, has_sajdah,
            audio_file, audio_url, audio_size
     FROM verses WHERE surah = ? ORDER BY verse`,
    number,
  );
  if (rows.length === 0) {
    throw new Error(`Surah ${number} has no verse rows in the database.`);
  }

  const items = rows.map(toVerse);
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
): Promise<Verse | null> {
  const row = await db.getFirstAsync<VerseRow>(
    `SELECT surah, verse, arabic, en, id, ar, tajweed_json, has_sajdah,
            audio_file, audio_url, audio_size
     FROM verses WHERE surah = ? AND verse = ?`,
    surahNumber,
    verseNumber,
  );
  return row ? toVerse(row) : null;
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
  const row = await db.getFirstAsync<
    VerseRow & { name: string; arabic_name: string }
  >(
    `SELECT v.surah, v.verse, v.arabic, v.en, v.id, v.ar, v.tajweed_json,
            v.has_sajdah, v.audio_file, v.audio_url, v.audio_size,
            s.name, s.arabic_name
     FROM verses v JOIN surahs s ON s.number = v.surah
     WHERE v.surah = ? AND v.verse = ?`,
    surahNumber,
    verseNumber,
  );
  if (!row) return null;
  return {
    surahNumber: row.surah,
    verseNumber: row.verse,
    surahName: row.name,
    surahArabicName: row.arabic_name,
    arabic: row.arabic,
    translation: row[language] ?? null,
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

export async function searchVerses(
  db: QuranDatabase,
  rawQuery: string,
  language: TranslationLanguage,
  limit = 120,
): Promise<SearchResult[]> {
  const query = normalize(rawQuery.trim());
  if (query.length < 2) return [];

  const rows = await db.getAllAsync<SearchRow>(
    `SELECT v.surah, v.verse, v.arabic, v.arabic_search, v.en, v.id, v.ar,
            v.tajweed_json, v.has_sajdah, v.audio_file, v.audio_url, v.audio_size,
            s.name, s.arabic_name
     FROM verses v JOIN surahs s ON s.number = v.surah
     WHERE instr(v.arabic_search, ?) > 0 OR instr(v.en_search, ?) > 0
     ORDER BY v.surah, v.verse
     LIMIT ?`,
    query,
    query,
    limit,
  );

  return rows.map((row) => {
    const matchField = row.arabic_search.includes(query) ? "arabic" : "translation";
    const translation =
      language === "en" ? row.en : language === "id" ? row.id : row.ar;
    return {
      surahNumber: row.surah,
      verseNumber: row.verse,
      surahName: row.name,
      surahArabicName: row.arabic_name,
      arabic: excerptFor(row.arabic, matchField === "arabic" ? query : "", 190),
      translation: translation
        ? excerptFor(translation, matchField === "translation" ? query : "", 190)
        : null,
      matchField,
    };
  });
}

export async function getSajdahReferences(
  db: QuranDatabase,
): Promise<Array<{ surahNumber: number; verseNumber: number }>> {
  const rows = await db.getAllAsync<{ surah: number; verse: number }>(
    "SELECT surah, verse FROM verses WHERE has_sajdah = 1 ORDER BY surah, verse",
  );
  return rows.map((row) => ({ surahNumber: row.surah, verseNumber: row.verse }));
}
