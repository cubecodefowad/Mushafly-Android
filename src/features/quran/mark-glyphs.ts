import { MARK_GLYPHS } from "../../data/generated/mark-glyphs";
import type { MarkGlyphData } from "../../types/quran";

export type MarkGlyphView = {
  data: MarkGlyphData;
  /** SVG viewBox cropping the padded ink box, in flipped (y-down) units. */
  viewBox: string;
  width: number;
  height: number;
};

/**
 * Geometry for one sign. Returns null for anything the generator did not
 * outline, so a future mark without an outline cannot draw an empty box
 * silently: the caller can fall back or omit it.
 */
export function markGlyphView(glyph: string): MarkGlyphView | null {
  const codepoint = glyph.codePointAt(0);
  if (codepoint === undefined) return null;
  const data = MARK_GLYPHS[codepoint];
  if (!data) return null;

  const width = data.maxX - data.minX;
  const height = data.maxY - data.minY;
  if (!(width > 0) || !(height > 0)) return null;

  // Font units grow upward; SVG grows downward, so the ink box's top is the
  // distance from the em top (the baseline in font units) to maxY.
  const top = data.unitsPerEm - data.maxY;
  return {
    data,
    viewBox: `${data.minX} ${top} ${width} ${height}`,
    width,
    height,
  };
}
