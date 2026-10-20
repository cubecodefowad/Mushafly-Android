import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { DATA_VERSION } from "./generated/source";

const DATA_DIRECTORY = new Directory(Paths.document, "mushafly");
const DATABASE_FILE = new File(DATA_DIRECTORY, "quran.db");
const VERSION_FILE = new File(DATA_DIRECTORY, "quran.version");

let opening: Promise<SQLite.SQLiteDatabase> | null = null;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function verify(db: SQLite.SQLiteDatabase, fullCheck: boolean): Promise<void> {
  const schema = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = 'schemaVersion'",
  );
  assert(schema?.value === "2", "The bundled Quran database has an unexpected schema version.");

  const row = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM surahs");
  assert(Number(row?.n) === 114, "The bundled Quran database does not contain 114 surahs.");

  const verses = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM verses WHERE verse > 0",
  );
  assert(Number(verses?.n) === 6236, "The bundled Quran database does not contain 6,236 verses.");

  const sajdah = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM verses WHERE has_sajdah = 1",
  );
  assert(Number(sajdah?.n) === 15, "The bundled Quran database is missing sajdah metadata.");

  const datasets = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(DISTINCT dataset) AS n FROM translations",
  );
  assert(
    Number(datasets?.n) >= 20,
    "The bundled Quran database is missing its translation datasets.",
  );

  if (fullCheck) {
    const check = await db.getFirstAsync<Record<string, string>>("PRAGMA quick_check");
    assert(
      Object.values(check ?? {})[0] === "ok",
      "The bundled Quran database failed SQLite's integrity check.",
    );
  }
}

async function installAndOpen(): Promise<SQLite.SQLiteDatabase> {
  DATA_DIRECTORY.create({ intermediates: true, idempotent: true });

  let installedVersion: string | null = null;
  try {
    installedVersion = VERSION_FILE.exists ? VERSION_FILE.textSync().trim() : null;
  } catch {
    installedVersion = null;
  }

  const versionMatches = installedVersion === DATA_VERSION;
  const needsCopy = !DATABASE_FILE.exists || !versionMatches;
  let copied = false;

  if (needsCopy) {
    const asset = Asset.fromModule(require("../../assets/data/quran.db"));
    await asset.downloadAsync();
    if (!asset.localUri) {
      throw new Error(
        "The bundled Quran database is missing from this build. Reinstall the app or rebuild it from the repository.",
      );
    }
    if (DATABASE_FILE.exists) DATABASE_FILE.delete();
    await new File(asset.localUri).copy(DATABASE_FILE);
    await VERSION_FILE.write(DATA_VERSION);
    copied = true;
  }

  let db: SQLite.SQLiteDatabase | null = null;
  try {
    db = await SQLite.openDatabaseAsync(
      "quran.db",
      { useNewConnection: true },
      DATA_DIRECTORY.uri,
    );
    await db.execAsync("PRAGMA query_only = ON;");
    await verify(db, copied);
    return db;
  } catch (error) {
    if (db) await db.closeAsync().catch(() => {});
    // A failed copy or verification is recoverable: remove the marker so the
    // next attempt re-copies from the bundled asset rather than opening it again.
    try {
      if (DATABASE_FILE.exists) DATABASE_FILE.delete();
      if (VERSION_FILE.exists) VERSION_FILE.delete();
    } catch {
      // The original error is more useful than a cleanup error.
    }
    throw error;
  }
}

/**
 * Opens the read-only Quran database, copying it out of the app bundle on first
 * launch or when the pinned data version changes. The returned promise is
 * cached for the lifetime of the process; a failure clears the cache so a user
 * initiated retry can try again.
 */
export function ensureQuranDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!opening) {
    opening = installAndOpen().catch((error: unknown) => {
      opening = null;
      throw error;
    });
  }
  return opening;
}
