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
 * Turns source ranges into render segments without ever rewriting the source
 * string. If the ranges cannot be applied faithfully, the verse is returned as
 * plain text plus an explicit reason instead of a guessed or partial overlay.
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

  let cursor = 0;
  const segments: RenderSegment[] = [];
  const applied = new Set<string>();

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

    if (start > cursor) segments.push({ text: sourceText.slice(cursor, start) });
    segments.push({ text: sourceText.slice(start, end), rule: range.rule });
    applied.add(range.rule);
    cursor = end;
  }

  if (cursor < sourceText.length) segments.push({ text: sourceText.slice(cursor) });

  // Final guard: rendered characters must equal the source string exactly.
  if (segments.map((segment) => segment.text).join("") !== sourceText) {
    return unavailable(sourceText, "alignment");
  }

  return {
    status: "ok",
    segments,
    appliedRules: [...applied],
  };
}

function unavailable(sourceText: string, reason: TajweedReason): TajweedRender {
  return {
    status: "unavailable",
    reason,
    segments: [{ text: sourceText }],
    appliedRules: [],
  };
}
