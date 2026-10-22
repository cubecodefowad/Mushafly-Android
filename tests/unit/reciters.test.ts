import {
  ACTIVE_GROUPS,
  DEFAULT_RECITER,
  EXCLUDED_RECITERS,
  RECITERS,
  everyayahUrl,
  isReciterId,
  recitationUrl,
  reciterInfo,
} from "../../src/features/audio/reciters";

const PINNED_URL = "https://raw.githubusercontent.com/example/audio/001001.mp3";

describe("recitation catalogue", () => {
  it("offers the pinned default first and the audited website editions after it", () => {
    expect(RECITERS.length).toBe(71);
    expect(RECITERS[0].id).toBe(DEFAULT_RECITER);
    expect(RECITERS[0].folder).toBeNull();
    expect(EXCLUDED_RECITERS.length).toBe(9);
    expect(ACTIVE_GROUPS.map((group) => group.kind)).toEqual([
      "hafs",
      "warsh",
      "translation",
    ]);
  });

  it("has unique, stable ids and a folder for every everyayah edition", () => {
    const ids = RECITERS.map((reciter) => reciter.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const reciter of RECITERS) {
      expect(reciter.name.length).toBeGreaterThan(0);
      if (reciter.id !== DEFAULT_RECITER) {
        expect(reciter.folder).toBeTruthy();
        expect(reciter.sourceUrl).toBe("https://everyayah.com/");
      }
    }
  });

  it("recognises only catalogue ids", () => {
    expect(isReciterId(DEFAULT_RECITER)).toBe(true);
    expect(isReciterId("abdul-basit-mujawwad-128kbps")).toBe(true);
    expect(isReciterId("does-not-exist")).toBe(false);
    expect(isReciterId(42)).toBe(false);
    expect(isReciterId(null)).toBe(false);
  });

  it("falls back to the pinned reciter for an unknown id", () => {
    expect(reciterInfo("does-not-exist").id).toBe(DEFAULT_RECITER);
    expect(reciterInfo(DEFAULT_RECITER).folder).toBeNull();
  });

  it("builds zero-padded everyayah URLs", () => {
    expect(everyayahUrl("Alafasy_128kbps", 2, 255)).toBe(
      "https://everyayah.com/data/Alafasy_128kbps/002255.mp3",
    );
    expect(everyayahUrl("Alafasy_128kbps", 1, 1)).toBe(
      "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
    );
  });

  it("keeps the pinned URL for the default reciter", () => {
    expect(recitationUrl(DEFAULT_RECITER, 2, 255, PINNED_URL)).toBe(PINNED_URL);
  });

  it("resolves everyayah files for the selected reciter", () => {
    expect(recitationUrl("abdul-basit-mujawwad-128kbps", 2, 255, PINNED_URL)).toBe(
      "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/002255.mp3",
    );
  });

  it("uses Al-Fatiha 1:1 when a folder ships no Bismillah file", () => {
    const withoutBismillah = RECITERS.find(
      (reciter) => reciter.folder && !reciter.bismillahFiles,
    );
    expect(withoutBismillah).toBeDefined();
    expect(recitationUrl(withoutBismillah!.id, 2, 0, PINNED_URL)).toBe(
      everyayahUrl(withoutBismillah!.folder!, 1, 1),
    );
  });

  it("uses the folder's own Bismillah file when it has one", () => {
    const withBismillah = RECITERS.find(
      (reciter) => reciter.folder && reciter.bismillahFiles,
    );
    expect(withBismillah).toBeDefined();
    expect(recitationUrl(withBismillah!.id, 2, 0, PINNED_URL)).toBe(
      everyayahUrl(withBismillah!.folder!, 2, 0),
    );
  });

  it("reports no recitation when the pinned source has no audio at all", () => {
    expect(recitationUrl("abdul-basit-mujawwad-128kbps", 1, 1, null)).toBeNull();
  });
});
