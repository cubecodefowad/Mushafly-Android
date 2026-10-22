import {
  DEFAULT_SETTINGS,
  SETTINGS_LIMITS,
  adjustSize,
  parseSettings,
  translationInfo,
} from "../../src/features/settings/settings";

describe("reader settings", () => {
  it("uses the documented defaults for malformed input", () => {
    for (const value of [null, undefined, "nope", 42, []]) {
      expect(parseSettings(value)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it("keeps valid values", () => {
    const parsed = parseSettings({
      theme: "dark",
      arabicSize: 40,
      translationSize: 20,
      showTranslation: false,
      tajweed: false,
      translation: "en",
      reciter: "abdul-basit-mujawwad-128kbps",
      autoAdvanceAudio: false,
      unknownKey: "ignored",
    });
    expect(parsed.theme).toBe("dark");
    expect(parsed.arabicSize).toBe(40);
    expect(parsed.translationSize).toBe(20);
    expect(parsed.showTranslation).toBe(false);
    expect(parsed.tajweed).toBe(false);
    expect(parsed.autoAdvanceAudio).toBe(false);
    expect(parsed.reciter).toBe("abdul-basit-mujawwad-128kbps");
    expect(parsed).not.toHaveProperty("unknownKey");
  });

  it("clamps out-of-range font sizes and rejects non-numbers", () => {
    const huge = parseSettings({ arabicSize: 500, translationSize: 500 });
    expect(huge.arabicSize).toBe(SETTINGS_LIMITS.arabicSize.max);
    expect(huge.translationSize).toBe(SETTINGS_LIMITS.translationSize.max);

    const tiny = parseSettings({ arabicSize: 1, translationSize: 1 });
    expect(tiny.arabicSize).toBe(SETTINGS_LIMITS.arabicSize.min);
    expect(tiny.translationSize).toBe(SETTINGS_LIMITS.translationSize.min);

    const bogus = parseSettings({ arabicSize: "large", translationSize: null });
    expect(bogus.arabicSize).toBe(DEFAULT_SETTINGS.arabicSize);
    expect(bogus.translationSize).toBe(DEFAULT_SETTINGS.translationSize);
  });

  it("rounds fractional sizes instead of storing them", () => {
    expect(parseSettings({ arabicSize: 34.6 }).arabicSize).toBe(35);
  });

  it("falls back for an unknown theme, translation or reciter", () => {
    const parsed = parseSettings({ theme: "sepia", translation: "fr", reciter: "nobody" });
    expect(parsed.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(parsed.translation).toBe(DEFAULT_SETTINGS.translation);
    expect(parsed.reciter).toBe(DEFAULT_SETTINGS.reciter);
  });

  it("steps font size inside its limits", () => {
    const { min, max } = SETTINGS_LIMITS.arabicSize;
    expect(adjustSize(min, -4, { min, max })).toBe(min);
    expect(adjustSize(max, 4, { min, max })).toBe(max);
    expect(adjustSize(34, 2, { min, max })).toBe(36);
  });

  it("describes the selected translation from the pinned source", () => {
    const info = translationInfo(DEFAULT_SETTINGS.translation);
    expect(info.languageCode).toBe(DEFAULT_SETTINGS.translation);
    expect(info.label.length).toBeGreaterThan(0);
    expect(info.translator.length).toBeGreaterThan(0);
    expect(info.source.length).toBeGreaterThan(0);
    expect(info.id.length).toBeGreaterThan(0);
  });
});
