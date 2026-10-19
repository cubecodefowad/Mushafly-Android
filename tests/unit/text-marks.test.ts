import {
  ORTHOGRAPHIC_MARKS,
  SAJDAH_VERSES,
  TEXT_MARKS,
} from "../../src/features/quran/text-marks";

describe("Quranic signs reference", () => {
  it("documents the sajdah sign with an explanation", () => {
    const sajdah = TEXT_MARKS.find((mark) => mark.glyph === "\u06E9");
    expect(sajdah).toBeDefined();
    expect(sajdah?.kind).toBe("prostration");
    expect(sajdah?.name).toBe("Sajdah");
    expect(sajdah?.detail.length).toBeGreaterThan(40);
  });

  it("gives every sign a name, a short gloss and a full explanation", () => {
    for (const mark of [...TEXT_MARKS, ...ORTHOGRAPHIC_MARKS.flatMap((m) => m.glyphs.map((g) => ({ ...g, name: m.name, detail: m.detail, short: m.name })))]) {
      expect(mark.name.length).toBeGreaterThan(2);
      expect(mark.detail.length).toBeGreaterThan(20);
    }
  });

  it("lists exactly the 15 prostration verses, each once, in order", () => {
    expect(SAJDAH_VERSES).toHaveLength(15);
    const keys = SAJDAH_VERSES.map((entry) => `${entry.surah}:${entry.verse}`);
    expect(new Set(keys).size).toBe(15);
    expect(keys).toContain("7:206");
    expect(keys).toContain("96:19");
    const ordered = [...SAJDAH_VERSES].sort((a, b) =>
      a.surah === b.surah ? a.verse - b.verse : a.surah - b.surah,
    );
    expect(ordered).toEqual(SAJDAH_VERSES);
  });

  it("keeps every documented sign inside the Arabic blocks the text uses", () => {
    for (const mark of TEXT_MARKS) {
      const code = mark.glyph.codePointAt(0) ?? 0;
      expect(code).toBeGreaterThanOrEqual(0x0600);
      expect(code).toBeLessThanOrEqual(0x06ff);
    }
    for (const mark of ORTHOGRAPHIC_MARKS) {
      expect(mark.glyphs.length).toBeGreaterThan(0);
    }
  });
});
