import { MARK_GLYPHS } from "../../src/data/generated/mark-glyphs";
import { markGlyphView } from "../../src/features/quran/mark-glyphs";
import { ORTHOGRAPHIC_MARKS, TEXT_MARKS } from "../../src/features/quran/text-marks";

const documented = [
  ...TEXT_MARKS.map((mark) => mark.glyph),
  ...ORTHOGRAPHIC_MARKS.flatMap((mark) => mark.glyphs.map((part) => part.glyph)),
];

const codepoint = (glyph: string) => glyph.codePointAt(0) ?? 0;

describe("Quranic sign outlines", () => {
  it("has an outline for every sign the reference documents", () => {
    for (const glyph of documented) {
      const data = MARK_GLYPHS[codepoint(glyph)];
      expect(data).toBeDefined();
      expect(data.path.startsWith("M")).toBe(true);
      expect(data.path).toContain("Z");
      expect(data.unitsPerEm).toBe(1000);
    }
  });

  it("does not carry outlines for undocumented signs", () => {
    const documentedPoints = new Set(documented.map(codepoint));
    for (const key of Object.keys(MARK_GLYPHS)) {
      expect(documentedPoints.has(Number(key))).toBe(true);
    }
  });

  it("gives every outline a real, padded bounding box", () => {
    for (const data of Object.values(MARK_GLYPHS)) {
      expect(data.maxX).toBeGreaterThan(data.minX);
      expect(data.maxY).toBeGreaterThan(data.minY);
      // Superscript marks sit above the em box, so only the ink itself is
      // checked here; the viewBox is derived from it.
      expect(data.maxY).toBeGreaterThan(0);
      // A tight crop would clip the antialiased edge; both dimensions must
      // include the padding the generator adds.
      expect(data.maxX - data.minX).toBeGreaterThan(100);
      expect(data.maxY - data.minY).toBeGreaterThan(40);
    }
  });

  it("produces a finite, non-empty SVG viewBox for every sign", () => {
    for (const glyph of documented) {
      const view = markGlyphView(glyph);
      expect(view).not.toBeNull();
      const numbers = view!.viewBox.split(" ").map(Number);
      expect(numbers).toHaveLength(4);
      for (const value of numbers) expect(Number.isFinite(value)).toBe(true);
      expect(numbers[2]).toBeGreaterThan(0);
      expect(numbers[3]).toBeGreaterThan(0);
      expect(view!.width).toBe(numbers[2]);
      expect(view!.height).toBe(numbers[3]);
    }
    expect(markGlyphView("A")).toBeNull();
    expect(markGlyphView("")).toBeNull();
  });

  it("draws the zero-advance pause marks as real outlines", () => {
    // These are the signs that disappeared when they were rendered as a lone
    // combining mark in a Text: U+06D6..U+06DC have no advance width.
    for (const glyph of ["\u06D6", "\u06D7", "\u06D8", "\u06D9", "\u06DA", "\u06DB", "\u06DC"]) {
      const data = MARK_GLYPHS[codepoint(glyph)];
      expect(data).toBeDefined();
      expect(data.path.length).toBeGreaterThan(20);
    }
  });
});
