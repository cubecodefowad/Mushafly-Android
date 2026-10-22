/**
 * Recitation sources, mirroring the website's `src/data/reciters.ts`.
 *
 * The default reciter streams one MP3 per verse from the pinned quranjson
 * mirror, so every URL carries a commit and cannot change under the reader.
 * Every other reciter streams from everyayah.com, which names each file
 * `<surah:3><ayah:3>.mp3` inside a folder per reciter:
 *
 *   /data/Alafasy_128kbps/002255.mp3  → surah 2, ayah 255
 *   /data/Alafasy_128kbps/002000.mp3  → the unnumbered Bismillah of surah 2
 *
 * Ayah `000` is the Bismillah that opens a surah, and not every folder ships
 * those files. When it does not, the reader uses that reciter's `001001.mp3`,
 * which is the same Bismillah as the first ayah of Al-Fatiha.
 *
 * The catalogue itself comes from the website's audited manifest
 * (`scripts/audit-reciters.mjs` checks every folder for all 6,236 ayah files),
 * copied here by `scripts/sync-reciters.mjs`. A reciter is offered only when
 * every ayah file exists.
 */
import { RECITER_MANIFEST } from "../../data/generated/reciters";
import type {
  ExcludedReciter,
  Reciter,
  ReciterId,
  ReciterKind,
} from "../../types/quran";

export const EVERYAYAH_ORIGIN = "https://everyayah.com";

export const DEFAULT_RECITER: ReciterId = "ghamadi";

const PINNED: Reciter = {
  id: DEFAULT_RECITER,
  name: "Saad Al-Ghamadi",
  bitrate: "~40 kbps",
  kind: "hafs",
  language: "Arabic",
  source: "pinned dataset",
  sourceUrl: "http://www.versebyversequran.com/site/licence/",
  folder: null,
  bismillahFiles: true,
};

/** Default first, then the audited folders in the manifest's order. */
export const RECITERS: Reciter[] = [
  PINNED,
  ...RECITER_MANIFEST.reciters.map((reciter) => ({
    id: reciter.id,
    name: reciter.name,
    bitrate: reciter.bitrate === null ? null : `${reciter.bitrate} kbps`,
    kind: reciter.kind,
    language: reciter.language,
    source: "everyayah.com",
    sourceUrl: `${EVERYAYAH_ORIGIN}/`,
    folder: reciter.folder,
    bismillahFiles: reciter.bismillah,
  })),
];

export const EXCLUDED_RECITERS: ExcludedReciter[] = RECITER_MANIFEST.excluded;

export const RECITER_GROUPS: Array<{ kind: ReciterKind; label: string; note: string }> = [
  {
    kind: "hafs",
    label: "Arabic — Hafs",
    note: "Matches the Arabic text shown in the reader.",
  },
  {
    kind: "warsh",
    label: "Warsh reading",
    note: "A different reading; the Arabic text shown is Hafs.",
  },
  {
    kind: "translation",
    label: "Translated recitations",
    note: "The recitation follows a translation, not the Arabic ayah.",
  },
];

export const ACTIVE_GROUPS = RECITER_GROUPS.filter((group) =>
  RECITERS.some((reciter) => reciter.kind === group.kind),
);

const BY_ID = new Map<string, Reciter>(RECITERS.map((reciter) => [reciter.id, reciter]));

export function isReciterId(value: unknown): value is ReciterId {
  return typeof value === "string" && BY_ID.has(value);
}

export function reciterInfo(id: ReciterId): Reciter {
  return BY_ID.get(id) ?? PINNED;
}

const pad3 = (value: number) => String(value).padStart(3, "0");

/** `everyayahUrl("Alafasy_128kbps", 2, 255)` → `.../002255.mp3`. */
export function everyayahUrl(folder: string, surah: number, verse: number): string {
  return `${EVERYAYAH_ORIGIN}/data/${folder}/${pad3(surah)}${pad3(verse)}.mp3`;
}

/**
 * Resolves the MP3 for one verse. `pinnedUrl` is the per-verse URL built from
 * the pinned dataset; it stays authoritative for the default reciter and is
 * what marks a verse as having audio at all.
 */
export function recitationUrl(
  reciter: ReciterId,
  surah: number,
  verse: number,
  pinnedUrl: string | null,
): string | null {
  if (!pinnedUrl) return null;
  const info = reciterInfo(reciter);
  if (!info.folder) return pinnedUrl;
  if (verse === 0 && !info.bismillahFiles) {
    return everyayahUrl(info.folder, 1, 1);
  }
  return everyayahUrl(info.folder, surah, verse);
}

/** Description used by settings, e.g. `128 kbps · Arabic · everyayah.com`. */
export function reciterDescription(reciter: Reciter): string {
  return [
    reciter.bitrate,
    reciter.kind === "translation" ? reciter.language : null,
    reciter.source,
  ]
    .filter(Boolean)
    .join(" · ");
}
