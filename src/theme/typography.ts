/**
 * Vertical metrics for the bundled Amiri Quran face.
 *
 * The font reports an ascent of 1.815 em and a descent of 0.634 em, so a line
 * box needs at least 2.449 em. React Native on Android rewrites the font metrics
 * to whatever `lineHeight` it is handed; anything shorter than the font's own
 * line height is pulled inwards and clips the ink — the tall pause signs above
 * the letters and the tails below them. A round 2.5 em leaves a hair of margin
 * for the font's tallest sign (U+06D7 reaches 1.8138 em above the baseline).
 */
export const ARABIC_LINE_HEIGHT_RATIO = 2.5;

/** Line height that never clips Amiri Quran glyphs at `size` points. */
export function arabicLineHeight(size: number): number {
  return Math.ceil(size * ARABIC_LINE_HEIGHT_RATIO);
}
