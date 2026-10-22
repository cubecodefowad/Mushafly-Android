/** A dataset key such as `en`, `en.sahih` or `ur.kanzuliman`. */
export type TranslationLanguage = string;

export type TranslationInfo = {
  languageCode: TranslationLanguage;
  id: string;
  /** Language label used by the compact selector. */
  label: string;
  /** Short dataset name (for example "Saheeh International"). */
  shortName?: string;
  name: string;
  translator: string;
  source: string;
  lastUpdate?: string;
  direction: "ltr" | "rtl";
  /** BCP 47 code for the translated text itself. */
  htmlLang?: string;
  /** Display name of the language, used to group the selector. */
  language?: string;
  /** Selector group label. */
  group?: string;
  /** Non-empty verse rows in the dataset. */
  rows?: number;
  /** Surahs covered by the dataset. */
  suras?: number;
};

export type TranslationGroup = {
  label: string;
  translations: TranslationInfo[];
};

export type JuzRange = {
  index: string;
  verse: { start: string; end: string };
};

export type SurahMeta = {
  number: number;
  name: string;
  arabicName: string;
  verseCount: number;
  place: string;
  type: string;
  bismillah: boolean;
  juz: JuzRange[];
};

export type TajweedReason =
  | "out-of-bounds"
  | "overlap"
  | "unknown-rule"
  | "alignment"
  | "missing-annotations";

export type RenderSegment = {
  text: string;
  rule?: string;
};

export type TajweedRender = {
  status: "ok" | "none" | "unavailable";
  reason?: TajweedReason;
  segments: RenderSegment[];
  appliedRules: string[];
};

export type AudioReference = {
  file: string;
  url: string;
  size: number;
};

export type ReciterKind = "hafs" | "warsh" | "translation";

/** Search scope, matching the website's All / Arabic / translation filter. */
export type SearchMode = "all" | "arabic" | "translation";

/** Stable slug, stored in settings. */
export type ReciterId = string;

export type Reciter = {
  id: ReciterId;
  name: string;
  /** Human-readable bitrate, or null when the folder name omits it. */
  bitrate: string | null;
  kind: ReciterKind;
  /** Language of the recitation; Arabic for Hafs and Warsh. */
  language: string;
  source: string;
  sourceUrl: string;
  /** everyayah folder name; null uses the pinned per-verse URLs. */
  folder: string | null;
  /** Whether the folder ships its own NNN000.mp3 Bismillah files. */
  bismillahFiles: boolean;
};

export type ExcludedReciter = {
  name: string;
  folder: string;
  reason: "requested" | "incomplete";
  missingAyahs?: number;
  note?: string;
};

/** The shape of the website's audited `reciters.json`. */
export type ReciterManifest = {
  source: { page: string; audioOrigin: string; retrieved: string };
  expected: { ayahs: number; bismillah: number };
  counts: { offered: number; excluded: number };
  reciters: Array<{
    id: string;
    name: string;
    folder: string;
    bitrate: number | null;
    kind: ReciterKind;
    language: string;
    bismillah: boolean;
    files?: number;
  }>;
  excluded: ExcludedReciter[];
};

export type Verse = {
  surahNumber: number;
  /** 0 is the unnumbered Bismillah row, where the source supplies one. */
  number: number;
  key: string;
  arabic: string;
  /** The selected dataset's text for this verse, or null when it has no row. */
  translation: string | null;
  /** The dataset `translation` was read from. */
  translationLanguage: TranslationLanguage;
  tajweed: TajweedRender;
  hasSajdah: boolean;
  audio: AudioReference | null;
  audioUnavailableReason?: string;
};

export type Surah = {
  meta: SurahMeta;
  bismillah: Verse | null;
  verses: Verse[];
  prev: SurahMeta | null;
  next: SurahMeta | null;
  tajweedRules: string[];
  unavailableTajweedCount: number;
};

export type SourceInfo = {
  repository: string;
  commit: string;
  license: string;
  translations: TranslationInfo[];
  audio: {
    reciter: string;
    source: string;
    licenseUrl: string;
    bitrate?: string;
  };
  counts: {
    surahs: number;
    verses: number;
    arabicEntries: number;
    translationRows: Record<string, number>;
    tajweedSegments: number;
    bismillahVerses: number;
  };
};

export type ThemePreference = "system" | "light" | "dark";

export type ReaderSettings = {
  theme: ThemePreference;
  arabicSize: number;
  translationSize: number;
  showTranslation: boolean;
  tajweed: boolean;
  translation: TranslationLanguage;
  /** Recitation source; `ghamadi` is the pinned per-verse default. */
  reciter: ReciterId;
  autoAdvanceAudio: boolean;
  /** Follow the verse being recited while it plays. */
  followAudio: boolean;
};

export type BookmarkRecord = {
  surahNumber: number;
  verseNumber: number;
  createdAt: string;
};

export type LastRead = {
  surahNumber: number;
  verseNumber: number;
  updatedAt: string;
};

export type SearchResult = {
  surahNumber: number;
  verseNumber: number;
  surahName: string;
  surahArabicName: string;
  arabic: string;
  translation: string | null;
  matchField: "arabic" | "translation";
};
