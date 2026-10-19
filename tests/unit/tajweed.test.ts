import { renderTajweed } from "../../src/features/quran/tajweed";
import { TAJWEED_RULES } from "../../src/features/quran/tajweed-rules";
import { SAJDAH_VERSES } from "../../src/features/quran/text-marks";

const KNOWN = new Set(Object.keys(TAJWEED_RULES));
const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

function joined(rendered: ReturnType<typeof renderTajweed>): string {
  return rendered.segments.map((segment) => segment.text).join("");
}

describe("Tajweed rendering", () => {
  it("keeps every source character when rules are applied", () => {
    const result = renderTajweed(
      text,
      [
        { start: 0, end: 4, rule: "hamzat_wasl" },
        { start: 5, end: 13, rule: "madd_2" },
      ],
      { knownRules: KNOWN },
    );
    expect(result.status).toBe("ok");
    expect(joined(result)).toBe(text);
    expect(result.appliedRules.sort()).toEqual(["hamzat_wasl", "madd_2"]);
  });

  it("returns the plain source when a verse has no ranges", () => {
    const result = renderTajweed(text, [], { knownRules: KNOWN });
    expect(result.status).toBe("none");
    expect(joined(result)).toBe(text);
  });

  it("reports missing annotations instead of inventing highlights", () => {
    const result = renderTajweed(text, undefined, { knownRules: KNOWN });
    expect(result.status).toBe("unavailable");
    expect(result.reason).toBe("missing-annotations");
    expect(joined(result)).toBe(text);
  });

  it("rejects an unknown rule key rather than colouring it", () => {
    const result = renderTajweed(text, [{ start: 0, end: 3, rule: "not_a_rule" }], {
      knownRules: KNOWN,
    });
    expect(result.reason).toBe("unknown-rule");
    expect(joined(result)).toBe(text);
  });

  it("rejects overlapping ranges", () => {
    const result = renderTajweed(
      text,
      [
        { start: 0, end: 6, rule: "hamzat_wasl" },
        { start: 4, end: 9, rule: "madd_2" },
      ],
      { knownRules: KNOWN },
    );
    expect(result.reason).toBe("overlap");
    expect(joined(result)).toBe(text);
  });

  it("rejects ranges outside the source string", () => {
    const result = renderTajweed(text, [{ start: 0, end: text.length + 1, rule: "madd_2" }], {
      knownRules: KNOWN,
    });
    expect(result.reason).toBe("out-of-bounds");
    expect(joined(result)).toBe(text);
  });

  it("accounts for the one known BOM artifact without dropping it", () => {
    const withBom = `\uFEFF${text}`;
    const result = renderTajweed(withBom, [{ start: 0, end: 4, rule: "hamzat_wasl" }], {
      knownRules: KNOWN,
    });
    expect(result.status).toBe("ok");
    expect(joined(result)).toBe(withBom);
    expect(result.segments[0].text.startsWith("\uFEFF")).toBe(true);
    // The first highlighted segment starts after the BOM.
    expect(result.segments[1].text).toBe(withBom.slice(1, 5));
  });

  it("preserves the sajdah character in the last verse of Al-A'raf", () => {
    const verse = "…وَلَهُۥ يَسْجُدُونَ \u06E9";
    const result = renderTajweed(verse, [{ start: 0, end: 1, rule: "madd_2" }], {
      knownRules: KNOWN,
    });
    expect(joined(result)).toBe(verse);
    expect(joined(result).endsWith("\u06E9")).toBe(true);
    expect(SAJDAH_VERSES).toContainEqual({ surah: 7, verse: 206 });
  });
});
