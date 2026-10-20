import { renderTajweed } from "../../src/features/quran/tajweed";
import { TAJWEED_RULES } from "../../src/features/quran/tajweed-rules";
import { SAJDAH_VERSES } from "../../src/features/quran/text-marks";

const KNOWN = new Set(Object.keys(TAJWEED_RULES));
const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const NON_JOINING = new Set([
  "\u0627",
  "\u0623",
  "\u0625",
  "\u0622",
  "\u0671",
  "\u062F",
  "\u0630",
  "\u0631",
  "\u0632",
  "\u0648",
  "\u0624",
  "\u0629",
  "\u0621",
  "\u0649",
  "\u06E5",
  "\u06E6",
]);

const MARK =
  /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/;

function joined(rendered: ReturnType<typeof renderTajweed>): string {
  return rendered.segments.map((segment) => segment.text).join("");
}

/**
 * The renderer must only begin a coloured run where the Arabic shaper can start
 * a new run without disconnecting a joined word.
 */
function assertShapingSafe(source: string, rendered: ReturnType<typeof renderTajweed>) {
  let offset = 0;
  for (const segment of rendered.segments) {
    if (offset > 0 && segment.rule) {
      if (MARK.test(source[offset])) {
        expect(/\s/.test(source[offset - 1])).toBe(true);
      }
      let index = offset - 1;
      while (index > 0 && MARK.test(source[index])) index--;
      const previous = source[index];
      const safe = /\s/.test(previous) || NON_JOINING.has(previous);
      if (!safe) {
        throw new Error(
          `colour run starts inside a joined word at ${offset}: ${JSON.stringify(
            source.slice(Math.max(0, offset - 6), offset + 6),
          )}`,
        );
      }
      expect(safe).toBe(true);
    }
    offset += segment.text.length;
  }
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
    expect(result.appliedRules.sort()).toEqual([ "hamzat_wasl", "madd_2" ]);
    assertShapingSafe(text, result);
  });

  it("does not split a letter from its diacritics", () => {
    const result = renderTajweed(
      text,
      [
        { start: 3, end: 4, rule: "madd_2" },
        { start: 10, end: 11, rule: "ghunnah" },
        { start: 22, end: 23, rule: "qalqalah" },
      ],
      { knownRules: KNOWN },
    );
    expect(result.status).toBe("ok");
    expect(joined(result)).toBe(text);
    for (const segment of result.segments) {
      expect(segment.text).not.toMatch(new RegExp(`^${MARK.source}`));
    }
    assertShapingSafe(text, result);
  });

  it("keeps a rule that starts on a superscript alef attached to its base letter", () => {
    const verse = "صِرَٰطَ ٱلَّذِينَ";
    const start = verse.indexOf("\u0670");
    const result = renderTajweed(
      verse,
      [{ start, end: start + 1, rule: "madd_2" }],
      { knownRules: KNOWN },
    );
    expect(result.status).toBe("ok");
    expect(joined(result)).toBe(verse);
    const coloured = result.segments.filter((segment) => segment.rule === "madd_2");
    expect(coloured).toHaveLength(1);
    expect(coloured[0].text).toContain("\u0631");
    expect(coloured[0].text.endsWith("\u0670")).toBe(true);
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
    // The BOM is never painted into a coloured run.
    for (const segment of result.segments) {
      if (segment.rule) expect(segment.text).not.toContain("\uFEFF");
    }
    assertShapingSafe(withBom, result);
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
