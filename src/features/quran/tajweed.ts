import type { RenderSegment, TajweedReason, TajweedRender } from "../../types/quran";

export type RawTajweedRange = {
  start: number;
  end: number;
  rule: string;
};

export type RenderTajweedOptions = {
  knownRules?: ReadonlySet<string>;
  /** The single known U+FEFF artifact is measured without the BOM prefix. */
  offsetShift?: number;
};

const BOM = "\uFEFF";

/**
 * Arabic letters that do not join the letter that follows them. A coloured run
 * may only begin after one of these (or after whitespace), because React Native
 * on Android shapes every nested Text run on its own: a run that starts in the
 * middle of a joined word is drawn with disconnected letters.
 */
const NON_JOINING_FORWARD = new Set([
  "\u0627", // alef
  "\u0623", // alef with hamza above
  "\u0625", // alef with hamza below
  "\u0622", // alef with madda
  "\u0671", // alef wasla
  "\u062F", // dal
  "\u0630", // thal
  "\u0631", // reh
  "\u0632", // zay
  "\u0648", // waw
  "\u0624", // waw with hamza
  "\u0629", // teh marbuta
  "\u0621", // hamza
  "\u0649", // alef maksura
  "\u06E5", // small waw
  "\u06E6", // small yeh
]);

/** Combining marks and Quranic annotation signs that belong to the letter before them. */
function isCombiningMark(code: number): boolean {
  return (
    (code >= 0x064b && code <= 0x065f) || // tanween, harakat, shadda, sukun
    code === 0x0670 || // superscript alef
    (code >= 0x06d6 && code <= 0x06dc) || // pause marks
    (code >= 0x06df && code <= 0x06e4) || // small high signs
    code === 0x06e7 ||
    code === 0x06e8 ||
    (code >= 0x06ea && code <= 0x06ed) ||
    (code >= 0x08d3 && code <= 0x08e1) ||
    (code >= 0x08e3 && code <= 0x08ff)
  );
}

const isSpace = (value: string) => /\s/.test(value);

/**
 * Turns source ranges into render segments without ever rewriting the source
 * string. If the ranges cannot be applied faithfully the verse is returned as
 * plain text plus an explicit reason instead of a guessed or partial overlay.
 *
 * The returned segments are also *shaping safe*: no segment starts between a
 * letter and its diacritics, and no new colour starts inside a joined Arabic
 * word. That keeps the letters connected on Android's text engine, which
 * shapes each nested text run separately.
 */
export function renderTajweed(
  sourceText: string,
  ranges: RawTajweedRange[] | undefined,
  options: RenderTajweedOptions = {},
): TajweedRender {
  const plain: TajweedRender = {
    status: "none",
    segments: [{ text: sourceText }],
    appliedRules: [],
  };

  if (!Array.isArray(ranges)) {
    return {
      status: "unavailable",
      reason: "missing-annotations",
      segments: [{ text: sourceText }],
      appliedRules: [],
    };
  }
  if (ranges.length === 0) return plain;

  const knownRules = options.knownRules;
  const shift = options.offsetShift ?? (sourceText.startsWith(BOM) ? 1 : 0);
  const sorted = [...ranges].sort((a, b) => a.start - b.start);

  const ruleAt: Array<string | undefined> = new Array(sourceText.length);
  let cursor = 0;

  for (const range of sorted) {
    const start = range.start + shift;
    const end = range.end + shift;

    if (
      !Number.isInteger(range.start) ||
      !Number.isInteger(range.end) ||
      start < 0 ||
      end > sourceText.length ||
      start >= end
    ) {
      return unavailable(sourceText, "out-of-bounds");
    }
    if (knownRules && !knownRules.has(range.rule)) {
      return unavailable(sourceText, "unknown-rule");
    }
    // Overlapping ranges cannot be represented as a flat, faithful segment list.
    if (start < cursor) {
      return unavailable(sourceText, "overlap");
    }

    for (let index = start; index < end; index++) ruleAt[index] = range.rule;
    cursor = end;
  }

  const segments = safeSegments(sourceText, ruleAt);

  // Final guard: rendered characters must equal the source string exactly.
  if (segments.map((segment) => segment.text).join("") !== sourceText) {
    return unavailable(sourceText, "alignment");
  }

  const applied = new Set<string>();
  for (const segment of segments) if (segment.rule) applied.add(segment.rule);

  return {
    status: "ok",
    segments,
    appliedRules: [...applied],
  };
}

type Cluster = {
  start: number;
  end: number;
  rule?: string;
};

type Word = {
  start: number;
  end: number;
  clusters: Cluster[];
};

/**
 * Groups the text into words, then into letter clusters. A displayed colour run
 * is only allowed to begin at a word start or after a letter that does not join
 * forward, so the native text engine can shape each run without breaking the
 * cursive connection of the word it belongs to.
 */
function safeSegments(sourceText: string, ruleAt: Array<string | undefined>): RenderSegment[] {
  const segments: RenderSegment[] = [];
  const push = (text: string, rule?: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.rule === rule) {
      last.text += text;
      return;
    }
    segments.push(rule ? { text, rule } : { text });
  };

  let index = 0;
  while (index < sourceText.length) {
    // Whitespace is its own run and every following word may start a new run.
    if (isSpace(sourceText[index])) {
      let end = index;
      while (end < sourceText.length && isSpace(sourceText[end])) end++;
      push(sourceText.slice(index, end));
      index = end;
      continue;
    }

    const word: Word = { start: index, end: index, clusters: [] };
    while (index < sourceText.length && !isSpace(sourceText[index])) {
      const start = index;
      index++;
      while (index < sourceText.length && isCombiningMark(sourceText.charCodeAt(index))) {
        index++;
      }
      const rule = wordRule(ruleAt, start, index);
      word.clusters.push({ start, end: index, rule });
      word.end = index;
    }

    // Split the word at safe boundaries only. A group takes the rule that
    // covers most of its characters; rules that cannot be separated faithfully
    // stay part of the containing group rather than breaking the word apart.
    let groupStart = word.clusters[0].start;
    let groupRule = word.clusters[0].rule;
    let current = word.clusters[0];

    for (let position = 1; position < word.clusters.length; position++) {
      const cluster = word.clusters[position];
      if (!isSafeBoundary(sourceText, current.end)) {
        // The colour cannot change here without splitting joined letters.
        groupRule = groupRule ?? cluster.rule;
        current = cluster;
        continue;
      }
      push(sourceText.slice(groupStart, current.end), groupRule);
      groupStart = cluster.start;
      groupRule = cluster.rule;
      current = cluster;
    }
    push(sourceText.slice(groupStart, current.end), groupRule);
  }

  if (segments.length === 0) segments.push({ text: sourceText });
  return segments;
}

function wordRule(
  ruleAt: Array<string | undefined>,
  start: number,
  end: number,
): string | undefined {
  const counts = new Map<string, number>();
  for (let index = start; index < end; index++) {
    const rule = ruleAt[index];
    if (!rule) continue;
    counts.set(rule, (counts.get(rule) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [rule, count] of counts) {
    if (count > bestCount) {
      best = rule;
      bestCount = count;
    }
  }
  return best;
}

/** A run may start here without disconnecting the letter before it. */
function isSafeBoundary(sourceText: string, position: number): boolean {
  if (position <= 0 || position >= sourceText.length) return true;
  let index = position - 1;
  while (index > 0 && isCombiningMark(sourceText.charCodeAt(index))) index--;
  const previous = sourceText[index];
  if (isSpace(previous)) return true;
  return NON_JOINING_FORWARD.has(previous);
}

function unavailable(sourceText: string, reason: TajweedReason): TajweedRender {
  return {
    status: "unavailable",
    reason,
    segments: [{ text: sourceText }],
    appliedRules: [],
  };
}
