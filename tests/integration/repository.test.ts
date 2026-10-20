/**
 * @jest-environment node
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import {
  getSajdahReferences,
  getSurah,
  getVerse,
  getVersePreviews,
  listSurahs,
  searchVerses,
  type QuranDatabase,
} from "../../src/features/quran/repository";

const dbPath = path.resolve(__dirname, "../../assets/data/quran.db");

/**
 * The repository only needs `getFirstAsync`/`getAllAsync`. Running it against
 * Node's SQLite binding means these queries are exercised exactly as they are in
 * the app, rather than mocked.
 */
function openDatabase(): { db: DatabaseSync; adapter: QuranDatabase } {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const adapter = {
    async getFirstAsync<T>(sql: string, ...params: Array<string | number>) {
      return (db.prepare(sql).get(...params) ?? null) as T | null;
    },
    async getAllAsync<T>(sql: string, ...params: Array<string | number>) {
      return db.prepare(sql).all(...params) as T[];
    },
  } as unknown as QuranDatabase;
  return { db, adapter };
}

describe("Quran repository against the shipped database", () => {
  const { db, adapter } = openDatabase();
  afterAll(() => db.close());

  it("lists all 114 surahs with contiguous numbering", async () => {
    const surahs = await listSurahs(adapter);
    expect(surahs).toHaveLength(114);
    surahs.forEach((surah, index) => expect(surah.number).toBe(index + 1));
    expect(surahs[0]).toMatchObject({ number: 1, verseCount: 7, bismillah: false });
    expect(surahs[1]).toMatchObject({ number: 2, verseCount: 286 });
    expect(surahs[8]).toMatchObject({ number: 9, bismillah: false });
    expect(surahs[113]).toMatchObject({ number: 114, verseCount: 6, bismillah: true });
  });

  it("loads a surah with its Bismillah row and ordered verses", async () => {
    const surah = await getSurah(adapter, 2, "en");
    expect(surah.meta.number).toBe(2);
    expect(surah.bismillah?.number).toBe(0);
    expect(surah.bismillah?.arabic.length).toBeGreaterThan(0);
    expect(surah.verses).toHaveLength(286);
    expect(surah.verses[0].number).toBe(1);
    expect(surah.verses.at(-1)?.number).toBe(286);
    expect(surah.prev?.number).toBe(1);
    expect(surah.next?.number).toBe(3);
  });

  it("preserves the prostration character and flag on 7:206", async () => {
    const surah = await getSurah(adapter, 7, "en");
    const last = surah.verses.at(-1);
    expect(last?.number).toBe(206);
    expect(last?.hasSajdah).toBe(true);
    expect(last?.arabic.trimEnd().endsWith("\u06E9")).toBe(true);
    expect(surah.verses.filter((verse) => verse.hasSajdah)).toHaveLength(1);
  });

  it("renders Tajweed without changing any verse string", async () => {
    for (const number of [1, 2, 7, 36, 55, 96, 114]) {
      const surah = await getSurah(adapter, number, "en");
      for (const verse of [surah.bismillah, ...surah.verses]) {
        if (!verse) continue;
        const joined = verse.tajweed.segments.map((segment) => segment.text).join("");
        expect(joined).toBe(verse.arabic);
        if (verse.tajweed.status === "ok") {
          expect(verse.tajweed.appliedRules.length).toBeGreaterThan(0);
        } else {
          expect(verse.tajweed.segments).toHaveLength(1);
        }
      }
    }
  });

  it("never begins a Tajweed colour run inside a joined word", async () => {
    const nonJoining = new Set([
      "\u0627", "\u0623", "\u0625", "\u0622", "\u0671", "\u062F", "\u0630",
      "\u0631", "\u0632", "\u0648", "\u0624", "\u0629", "\u0621", "\u0649",
      "\u06E5", "\u06E6",
    ]);
    const mark = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/;
    let checked = 0;
    for (let number = 1; number <= 114; number++) {
      const surah = await getSurah(adapter, number, "en");
      for (const verse of surah.verses) {
        let offset = 0;
        for (const segment of verse.tajweed.segments) {
          if (offset > 0 && segment.rule) {
            // A standalone pause mark may begin a run; a mark attached to a
            // letter may not.
            if (mark.test(verse.arabic[offset])) {
              expect(/\s/.test(verse.arabic[offset - 1])).toBe(true);
            }
            let index = offset - 1;
            while (index > 0 && mark.test(verse.arabic[index])) index--;
            const previous = verse.arabic[index];
            if (!/\s/.test(previous) && !nonJoining.has(previous)) {
              throw new Error(
                `Colour run starts inside a joined word at ${number}:${verse.number} offset ${offset}`,
              );
            }
          }
          offset += segment.text.length;
        }
        checked++;
      }
    }
    expect(checked).toBe(6236);
  });

  it("keeps the single source BOM at 1:1 and nowhere else", async () => {
    const first = await getSurah(adapter, 1, "en");
    expect(first.verses[0].arabic.startsWith("\uFEFF")).toBe(true);
    const rows = db
      .prepare("SELECT surah, verse FROM verses WHERE instr(arabic, char(65279)) > 0")
      .all() as Array<{ surah: number; verse: number }>;
    expect(rows).toEqual([{ surah: 1, verse: 1 }]);
  });

  it("finds the 15 prostration references from SQL, not a hand-written list", async () => {
    const references = await getSajdahReferences(adapter);
    expect(references).toHaveLength(15);
    expect(references).toContainEqual({ surahNumber: 7, verseNumber: 206 });
    expect(references).toContainEqual({ surahNumber: 96, verseNumber: 19 });
  });

  it("searches Arabic without diacritics and returns the original excerpt", async () => {
    const results = await searchVerses(adapter, "الرحمن", "en");
    expect(results.length).toBeGreaterThan(0);
    const result = results[0];
    expect(result.matchField).toBe("arabic");
    expect(result.arabic).toContain("\u064e");
    expect(result.surahNumber).toBeGreaterThanOrEqual(1);
  });

  it("searches the English translation and returns an aligned verse", async () => {
    const results = await searchVerses(adapter, "the most merciful", "en");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchField).toBe("translation");
    expect(results[0].translation).toBeTruthy();
    expect(results[0].surahNumber).toBeGreaterThanOrEqual(1);
  });

  it("never returns the unnumbered Bismillah row as a search result", async () => {
    const arabic = await searchVerses(adapter, "بسم الله", "en");
    expect(arabic.every((result) => result.verseNumber > 0)).toBe(true);
    const english = await searchVerses(adapter, "in the name of god", "en");
    expect(english.every((result) => result.verseNumber > 0)).toBe(true);
  });

  it("returns no results for a query shorter than two characters", async () => {
    expect(await searchVerses(adapter, "a", "en")).toEqual([]);
    expect(await searchVerses(adapter, "  ", "en")).toEqual([]);
  });

  it("loads verse previews for bookmarks with the selected translation", async () => {
    const previews = await getVersePreviews(
      adapter,
      [
        { surahNumber: 1, verseNumber: 1 },
        { surahNumber: 2, verseNumber: 255 },
        { surahNumber: 114, verseNumber: 6 },
      ],
      "id",
    );
    expect(previews.size).toBe(3);
    const ayah = previews.get("2:255");
    expect(ayah?.arabic).toContain("\u064E");
    expect(ayah?.translation?.length).toBeGreaterThan(10);
  });

  it("reads the selected dataset rather than a hard-coded translation", async () => {
    const itani = await getSurah(adapter, 1, "en");
    const saheeh = await getSurah(adapter, 1, "en.sahih");
    const urdu = await getSurah(adapter, 1, "ur.kanzuliman");
    expect(itani.verses[0].translation).toBeTruthy();
    expect(saheeh.verses[0].translation).toBeTruthy();
    expect(saheeh.verses[0].translation).not.toBe(itani.verses[0].translation);
    expect(urdu.verses[0].translation).toMatch(/[\u0600-\u06FF]/);
    expect(itani.verses[0].translationLanguage).toBe("en");
    expect(urdu.verses[0].translationLanguage).toBe("ur.kanzuliman");
  });

  it("leaves the Bismillah row untranslated when a dataset has no row for it", async () => {
    const surah = await getSurah(adapter, 2, "en.sahih");
    expect(surah.bismillah?.number).toBe(0);
    expect(surah.bismillah?.translation).toBeNull();
    expect(surah.verses[0].translation).toBeTruthy();
  });

  it("reads every bundled edition, including the six Urdu datasets", async () => {
    const urdu = [
      "ur.kanzuliman",
      "ur.junagarhi",
      "ur.maududi",
      "ur.ahmedali",
      "ur.jalandhry",
      "ur.qadri",
    ] as const;
    for (const dataset of urdu) {
      const surah = await getSurah(adapter, 1, dataset);
      expect(surah.verses).toHaveLength(7);
      expect(surah.verses[0].translation).toMatch(/[\u0600-\u06FF]/);
      expect(surah.verses[0].translationLanguage).toBe(dataset);
    }
    // Editions the 1.1.0 build did not bundle at all.
    expect((await getSurah(adapter, 1, "ur.qadri")).verses[0].translation).not.toBe(
      (await getSurah(adapter, 1, "ur.maududi")).verses[0].translation,
    );
  });

  it("searches whichever translation dataset is selected", async () => {
    const saheeh = await searchVerses(adapter, "the most merciful", "en.sahih");
    expect(saheeh.length).toBeGreaterThan(0);
    expect(saheeh[0].matchField).toBe("translation");
    const urdu = await searchVerses(adapter, "\u0627\u0644\u0644\u06c1", "ur.kanzuliman");
    expect(urdu.length).toBeGreaterThan(0);
    expect(urdu[0].translation).toMatch(/[\u0600-\u06FF]/);
  });

  it("returns one verse with its sajdah flag and source audio URL", async () => {
    const verse = await getVerse(adapter, 96, 19, "en");
    expect(verse?.hasSajdah).toBe(true);
    expect(verse?.arabic.endsWith("\u06E9")).toBe(true);
    expect(verse?.audio?.url).toMatch(
      /^https:\/\/raw\.githubusercontent\.com\/semarketir\/quranjson\/[0-9a-f]{40}\//,
    );
  });
});
