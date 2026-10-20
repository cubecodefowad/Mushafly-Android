import {
  excerptFor,
  normalize,
  normalizeForSearch,
  normalizeWithMap,
} from "../../src/features/quran/normalize";

const source = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

describe("translation search normalization", () => {
  it("keeps the letters of non-Latin scripts", () => {
    expect(normalizeForSearch("اللہ اکبر")).toContain("اللہ");
    expect(normalizeForSearch("আল্লাহ")).toContain("আল্লাহ");
    expect(normalizeForSearch("Бог милостивый")).toContain("бог");
    expect(normalizeForSearch("慈悲深い")).toBe("慈悲深い");
  });

  it("folds case, accents and punctuation", () => {
    expect(normalizeForSearch("  The Most Merciful.  ")).toBe("the most merciful");
    expect(normalizeForSearch("Café — déjà vu!")).toBe("cafe deja vu");
    expect(normalizeForSearch("merciful، gracious")).toBe("merciful gracious");
  });

  it("removes Arabic diacritics without dropping the letters", () => {
    expect(normalizeForSearch("ٱلرَّحْمَٰنِ")).toBe("ٱلرحمن");
  });
});

describe("search normalization", () => {
  it("removes diacritics and Quranic annotation signs from the match copy", () => {
    expect(normalize("مُحَمَّدٌ")).toBe("محمد");
    expect(normalize("يَسْجُدُونَ ۩")).toBe("يسجدون");
  });

  it("folds alef, ta marbuta, ya and hamza carriers", () => {
    expect(normalize("أَإِآٱ")).toBe("اااا");
    expect(normalize("مُوسَىٰ")).toBe("موسي");
    expect(normalize("صَلَاةٌ")).toBe("صلاه");
    expect(normalize("شَيْءٌ")).toBe("شي");
  });

  it("keeps the display string untouched", () => {
    const before = source;
    normalize(source);
    expect(source).toBe(before);
    expect(source).toContain("\u0651");
  });

  it("maps every normalized character back to its source code unit", () => {
    const { text, map } = normalizeWithMap("مُحَمَّدٌ");
    expect(text).toBe("محمد");
    expect(map).toHaveLength(text.length);
    map.forEach((sourceIndex) => {
      expect(sourceIndex).toBeGreaterThanOrEqual(0);
      expect(sourceIndex).toBeLessThan("مُحَمَّدٌ".length);
    });
    expect("مُحَمَّدٌ"[map[0]]).toBe("م");
    expect("مُحَمَّدٌ"[map[3]]).toBe("د");
  });

  it("folds Latin diacritics and punctuation for the English index", () => {
    // Apostrophes are punctuation: the documented rule folds them to a space.
    expect(normalize("Muhammad’s mercy!")).toBe("muhammad s mercy");
    expect(normalize("  Allāh,  the   Merciful ")).toBe("allah the merciful");
  });

  it("collapses runs of spaces introduced by removed marks", () => {
    expect(normalize("a ۩ b")).toBe("a b");
  });

  it("returns an excerpt taken from the original source string", () => {
    const verse =
      "وَلِلَّهِ يَسْجُدُ مَن فِى ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ طَوْعًا وَكَرْهًا وَظِلَٰلُهُم بِٱلْغُدُوِّ وَٱلْآصَالِ ۩";
    const excerpt = excerptFor(verse, normalize("يسجد"), 60);
    expect(excerpt.length).toBeLessThanOrEqual(62);
    expect(excerpt).toContain("يَسْجُدُ");
    // Excerpts are slices of the source, never the normalized copy.
    expect(excerpt).toContain("\u064e");
    expect(verse).toContain(excerpt.replace(/…/g, ""));
  });

  it("returns short strings unchanged", () => {
    expect(excerptFor("قصير", "قصير", 100)).toBe("قصير");
  });
});
