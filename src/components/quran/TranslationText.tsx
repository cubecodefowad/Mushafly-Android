import { Text, type StyleProp, type TextStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * Translation copy is written in scripts the app does not bundle a font for, so
 * it is drawn with the device's own script font and the platform's line box.
 *
 * Setting an explicit `lineHeight` makes React Native on Android rewrite the
 * font metrics to fit that height. Any line shorter than the font's natural one
 * then clips the glyphs: Urdu, Persian and Bengali tails, and Latin descenders,
 * lose their bottom half. Letting the platform measure the line avoids that for
 * every language, at every font scale.
 */
export function TranslationText({
  text,
  size,
  rtl,
  center = false,
  numberOfLines,
  style,
  accessibilityLabel,
}: {
  text: string;
  size: number;
  rtl: boolean;
  center?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.6}
      style={[
        {
          color: colors.muted,
          fontSize: size,
          textAlign: center ? "center" : rtl ? "right" : "left",
          writingDirection: rtl ? "rtl" : "ltr",
        },
        rtl ? null : { fontFamily: fonts.serif },
        style,
      ]}
    >
      {text}
    </Text>
  );
}
