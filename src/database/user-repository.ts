import type { SQLiteBindValue } from "expo-sqlite";
import type { BookmarkRecord, LastRead } from "../types/quran";

/** The small surface of expo-sqlite used here, so the logic can be tested. */
export type UserDatabase = {
  getFirstAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SQLiteBindValue[]): Promise<T[]>;
  runAsync(source: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  execAsync(source: string): Promise<void>;
};

export const SETTINGS_KEY = "reader";

type BookmarkRow = { surah: number; verse: number; created_at: string };
type ReadingRow = { surah: number; verse: number; updated_at: string };

export function isValidReference(
  surahNumber: number,
  verseNumber: number,
): boolean {
  return (
    Number.isInteger(surahNumber) &&
    surahNumber >= 1 &&
    surahNumber <= 114 &&
    Number.isInteger(verseNumber) &&
    verseNumber >= 1
  );
}

export async function readSettingsJson(db: UserDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    SETTINGS_KEY,
  );
  return row?.value ?? null;
}

export async function writeSettingsJson(db: UserDatabase, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    SETTINGS_KEY,
    value,
  );
}

export async function deleteSettings(db: UserDatabase): Promise<void> {
  await db.runAsync("DELETE FROM settings WHERE key = ?", SETTINGS_KEY);
}

export async function listBookmarks(db: UserDatabase): Promise<BookmarkRecord[]> {
  const rows = await db.getAllAsync<BookmarkRow>(
    "SELECT surah, verse, created_at FROM bookmarks ORDER BY created_at DESC",
  );
  return rows.map((row) => ({
    surahNumber: row.surah,
    verseNumber: row.verse,
    createdAt: row.created_at,
  }));
}

export async function addBookmark(
  db: UserDatabase,
  surahNumber: number,
  verseNumber: number,
  createdAt = new Date().toISOString(),
): Promise<BookmarkRecord> {
  if (!isValidReference(surahNumber, verseNumber)) {
    throw new Error(`Invalid bookmark reference ${surahNumber}:${verseNumber}`);
  }
  await db.runAsync(
    "INSERT OR IGNORE INTO bookmarks (surah, verse, created_at) VALUES (?, ?, ?)",
    surahNumber,
    verseNumber,
    createdAt,
  );
  const row = await db.getFirstAsync<BookmarkRow>(
    "SELECT surah, verse, created_at FROM bookmarks WHERE surah = ? AND verse = ?",
    surahNumber,
    verseNumber,
  );
  if (!row) throw new Error("Bookmark was not persisted");
  return {
    surahNumber: row.surah,
    verseNumber: row.verse,
    createdAt: row.created_at,
  };
}

export async function removeBookmark(
  db: UserDatabase,
  surahNumber: number,
  verseNumber: number,
): Promise<void> {
  await db.runAsync(
    "DELETE FROM bookmarks WHERE surah = ? AND verse = ?",
    surahNumber,
    verseNumber,
  );
}

export async function getLastRead(db: UserDatabase): Promise<LastRead | null> {
  const row = await db.getFirstAsync<ReadingRow>(
    "SELECT surah, verse, updated_at FROM reading_state WHERE id = 1",
  );
  if (!row) return null;
  return {
    surahNumber: row.surah,
    verseNumber: row.verse,
    updatedAt: row.updated_at,
  };
}

export async function saveLastRead(
  db: UserDatabase,
  surahNumber: number,
  verseNumber: number,
  updatedAt = new Date().toISOString(),
): Promise<LastRead> {
  if (!isValidReference(surahNumber, verseNumber)) {
    throw new Error(`Invalid reading position ${surahNumber}:${verseNumber}`);
  }
  await db.runAsync(
    `INSERT INTO reading_state (id, surah, verse, updated_at) VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       surah = excluded.surah,
       verse = excluded.verse,
       updated_at = excluded.updated_at`,
    surahNumber,
    verseNumber,
    updatedAt,
  );
  return { surahNumber, verseNumber, updatedAt };
}
