/**
 * Search-only normalization.
 *
 * IMPORTANT: this module is applied to a *derived copy* of Quranic text for
 * matching. It is never applied to the strings the reader displays. The mapping
 * it returns lets the UI locate a match in the original source string so that
 * excerpts always come from the unmodified record.
 *
 * Documented transformations:
 *  - Arabic: remove harakat/tanwin/shadda/sukun (U+064B-U+065F), superscript
 *    alef (U+0670), Quranic annotation signs (U+06D6-U+06ED), tatweel (U+0640)
 *    and a leading BOM artifact (U+FEFF).
 *  - Arabic letters: آ أ إ ٱ -> ا, ى -> ي, ة -> ه, ؤ -> و, ئ -> ي, ء removed.
 *  - English: Unicode NFKD, combining marks removed, lowercase, punctuation
 *    folded to spaces.
 *  - Whitespace collapsed.
 *  - Nothing here changes displayed source text.
 *
 * Hermes supports `String.prototype.normalize`; this file deliberately avoids
 * `\p{...}` property escapes so behavior is identical on device and in Node.
 */

const ARABIC_MARKS = new Set<number>();
for (let code = 0x064b; code <= 0x065f; code++) ARABIC_MARKS.add(code);
ARABIC_MARKS.add(0x0670);
for (let code = 0x06d6; code <= 0x06ed; code++) ARABIC_MARKS.add(code);
ARABIC_MARKS.add(0x0640);
ARABIC_MARKS.add(0xfeff);

const ARABIC_LETTER_MAP: Record<string, string> = {
  "\u0622": "\u0627", // آ
  "\u0623": "\u0627", // أ
  "\u0625": "\u0627", // إ
  "\u0671": "\u0627", // ٱ
  "\u0649": "\u064a", // ى
  "\u0629": "\u0647", // ة
  "\u0624": "\u0648", // ؤ
  "\u0626": "\u064a", // ئ
  "\u0621": "", // ء
};

function isKeepable(code: number): boolean {
  // Letters, numbers and spaces only. Quranic punctuation/waqf marks become spaces.
  return (
    (code >= 0x0621 && code <= 0x064a) ||
    (code >= 0x0660 && code <= 0x0669) ||
    (code >= 0x06f0 && code <= 0x06f9) ||
    (code >= 0x0030 && code <= 0x0039) ||
    (code >= 0x0041 && code <= 0x005a) ||
    (code >= 0x0061 && code <= 0x007a) ||
    code === 0x0020
  );
}

export type Normalized = {
  text: string;
  /** For each character in `text`, the index of the source code unit it came from. */
  map: number[];
};

export function normalizeWithMap(source: string): Normalized {
  let text = "";
  const map: number[] = [];
  let lastWasSpace = true;

  for (let i = 0; i < source.length; ) {
    const codePoint = source.codePointAt(i);
    if (codePoint === undefined) break;
    const char = String.fromCodePoint(codePoint);
    const width = char.length;

    if (width === 1 && ARABIC_MARKS.has(codePoint)) {
      i += width;
      continue;
    }

    let mapped = char;
    if (width === 1 && ARABIC_LETTER_MAP[char] !== undefined) {
      mapped = ARABIC_LETTER_MAP[char];
    } else if (!isKeepable(codePoint)) {
      // Normalize Latin diacritics before deciding, e.g. "é" -> "e".
      mapped = char
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      mapped = mapped.replace(/[^a-z0-9\u0621-\u064a]/g, " ");
    } else {
      mapped = char.toLowerCase();
    }

    if (mapped === "") {
      i += width;
      continue;
    }

    for (const outChar of mapped) {
      if (outChar === " ") {
        if (lastWasSpace) continue;
        lastWasSpace = true;
      } else {
        lastWasSpace = false;
      }
      text += outChar;
      map.push(i);
    }
    i += width;
  }

  const trimmed = text.trim();
  return { text: trimmed, map: map.slice(0, trimmed.length) };
}

export function normalize(text: string): string {
  return normalizeWithMap(text).text;
}

/** Build a short excerpt from the original string centred on the first match. */
export function excerptFor(text: string, normalizedQuery: string, maxLength = 170): string {
  const { text: normalized, map } = normalizeWithMap(text);
  const hit = normalizedQuery ? normalized.indexOf(normalizedQuery) : -1;

  if (hit < 0 || text.length <= maxLength) {
    return text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}…`;
  }

  const sourceIndex = map[hit] ?? 0;
  let start = Math.max(0, sourceIndex - Math.floor(maxLength * 0.3));
  const endCandidate = Math.min(text.length, start + maxLength);
  let end = endCandidate;
  if (end === text.length) start = Math.max(0, end - maxLength);

  // Move to whitespace boundaries without altering the source itself.
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < sourceIndex) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > sourceIndex) end = space;
  }

  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}
