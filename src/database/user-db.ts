import * as SQLite from "expo-sqlite";

export const USER_DB_NAME = "mushafly-user.db";

/**
 * User data is deliberately separate from the bundled Quran database. A data
 * update can replace the Quran database without touching bookmarks, reading
 * position or preferences. Migrations here are additive only.
 */
export async function openUserDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(USER_DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS bookmarks (
      surah INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (surah, verse)
    );
    CREATE TABLE IF NOT EXISTS reading_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      surah INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS bookmarks_created_at ON bookmarks(created_at DESC);
    PRAGMA user_version = 1;
  `);
  return db;
}
