import { SOURCE_INFO } from "../../data/generated/source";
import type {
  ReaderSettings,
  ThemePreference,
  TranslationInfo,
  TranslationLanguage,
} from "../../types/quran";

export const TRANSLATIONS = SOURCE_INFO.translations;
export const DEFAULT_TRANSLATION: TranslationLanguage =
  TRANSLATIONS[0]?.languageCode ?? "en";

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "system",
  arabicSize: 34,
  translationSize: 17,
  showTranslation: true,
  tajweed: true,
  translation: DEFAULT_TRANSLATION,
  autoAdvanceAudio: true,
};

export const SETTINGS_LIMITS = {
  arabicSize: { min: 22, max: 52, step: 2 },
  translationSize: { min: 13, max: 28, step: 1 },
} as const;

const THEMES: ThemePreference[] = ["system", "light", "dark"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function isTranslationLanguage(value: unknown): value is TranslationLanguage {
  return TRANSLATIONS.some((entry) => entry.languageCode === value);
}

export function translationInfo(languageCode: TranslationLanguage): TranslationInfo {
  return (
    TRANSLATIONS.find((entry) => entry.languageCode === languageCode) ?? TRANSLATIONS[0]
  );
}

/**
 * Reads settings defensively. Unknown keys are ignored, out-of-range values are
 * clamped, and a malformed stored object falls back to the documented defaults
 * rather than preventing the app from starting.
 */
export function parseSettings(value: unknown): ReaderSettings {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

  const number = (
    key: keyof ReaderSettings,
    fallback: number,
    min: number,
    max: number,
  ): number => {
    const candidate = input[key];
    return typeof candidate === "number" && Number.isFinite(candidate)
      ? clamp(candidate, min, max)
      : fallback;
  };

  const bool = (key: keyof ReaderSettings, fallback: boolean): boolean =>
    typeof input[key] === "boolean" ? (input[key] as boolean) : fallback;

  const theme = THEMES.includes(input.theme as ThemePreference)
    ? (input.theme as ThemePreference)
    : DEFAULT_SETTINGS.theme;
  const translation = isTranslationLanguage(input.translation)
    ? input.translation
    : DEFAULT_SETTINGS.translation;

  return {
    theme,
    arabicSize: number(
      "arabicSize",
      DEFAULT_SETTINGS.arabicSize,
      SETTINGS_LIMITS.arabicSize.min,
      SETTINGS_LIMITS.arabicSize.max,
    ),
    translationSize: number(
      "translationSize",
      DEFAULT_SETTINGS.translationSize,
      SETTINGS_LIMITS.translationSize.min,
      SETTINGS_LIMITS.translationSize.max,
    ),
    showTranslation: bool("showTranslation", DEFAULT_SETTINGS.showTranslation),
    tajweed: bool("tajweed", DEFAULT_SETTINGS.tajweed),
    translation,
    autoAdvanceAudio: bool("autoAdvanceAudio", DEFAULT_SETTINGS.autoAdvanceAudio),
  };
}

export function adjustSize(
  current: number,
  delta: number,
  limits: { min: number; max: number },
): number {
  return clamp(current + delta, limits.min, limits.max);
}
