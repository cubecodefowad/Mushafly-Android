import {
  formatCount,
  formatTimestamp,
  referenceKey,
  surahHref,
} from "../../src/utils/reference";

describe("verse references", () => {
  it("builds a typed route to a surah or a verse", () => {
    expect(surahHref(2)).toEqual({
      pathname: "/surah/[number]",
      params: { number: "2" },
    });
    expect(surahHref(2, 255)).toEqual({
      pathname: "/surah/[number]",
      params: { number: "2", verse: "255" },
    });
  });

  it("uses stable surah:verse keys", () => {
    expect(referenceKey(2, 255)).toBe("2:255");
    expect(referenceKey(114, 6)).toBe("114:6");
    expect(referenceKey(2, 255)).not.toBe(referenceKey(255, 2));
  });

  it("formats playback timestamps defensively", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(9.9)).toBe("0:09");
    expect(formatTimestamp(61)).toBe("1:01");
    expect(formatTimestamp(3599)).toBe("59:59");
    expect(formatTimestamp(Number.NaN)).toBe("0:00");
    expect(formatTimestamp(-5)).toBe("0:00");
  });

  it("formats counts without throwing", () => {
    expect(formatCount(6236)).toMatch(/6.?236/);
  });
});
