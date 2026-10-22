import Svg, { G, Path } from "react-native-svg";
import { markGlyphView } from "../../features/quran/mark-glyphs";

/**
 * One Quranic sign, drawn from the bundled font's own outline.
 *
 * Most pause and orthographic signs are combining marks with zero advance
 * width. Android measures a lone mark in a Text as zero-width, so its ink is
 * clipped or dropped and the reference page showed empty boxes. A vector path
 * does not go through the text shaper: it is positioned from the font's
 * bounding box and is always visible, at any size, in either theme.
 *
 * The path uses font units with y upward. SVG measures y downward, so the
 * group flips the outline around the baseline, and the viewBox crops to the
 * padded ink box.
 */
export function MarkGlyph({
  glyph,
  size = 26,
  color,
}: {
  glyph: string;
  size?: number;
  color: string;
}) {
  const view = markGlyphView(glyph);
  if (!view) return null;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={view.viewBox}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
    >
      <G transform={`translate(0 ${view.data.unitsPerEm}) scale(1 -1)`}>
        <Path d={view.data.path} fill={color} />
      </G>
    </Svg>
  );
}
