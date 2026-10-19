import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { tajweedColor } from "../../theme/palette";
import type { RenderSegment } from "../../types/quran";

export function ArabicText({
  text,
  segments,
  size,
  showTajweed = false,
  color,
  center = false,
  style,
  numberOfLines,
  accessibilityLabel,
}: {
  text: string;
  segments?: RenderSegment[];
  size: number;
  showTajweed?: boolean;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
}) {
  const { scheme, colors, fonts } = useTheme();
  const baseColor = color ?? colors.ink;
  const canUseSegments =
    showTajweed && Array.isArray(segments) && segments.length > 0;

  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityLanguage="ar"
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.35}
      style={[
        styles.arabic,
        {
          color: baseColor,
          fontFamily: fonts.arabic,
          fontSize: size,
          lineHeight: Math.round(size * 2.12),
          textAlign: center ? "center" : "right",
        },
        style,
      ]}
      suppressHighlighting
    >
      {canUseSegments
        ? segments.map((segment, index) => {
            const ruleColor = tajweedColor(segment.rule, scheme);
            if (!segment.rule || !ruleColor) {
              return <Text key={index}>{segment.text}</Text>;
            }
            return (
              <Text
                key={index}
                style={{
                  color: ruleColor,
                  textDecorationLine: "underline",
                  textDecorationColor: ruleColor,
                }}
              >
                {segment.text}
              </Text>
            );
          })
        : text}
    </Text>
  );
}

const styles = StyleSheet.create({
  arabic: {
    writingDirection: "rtl",
    letterSpacing: 0,
  },
});
