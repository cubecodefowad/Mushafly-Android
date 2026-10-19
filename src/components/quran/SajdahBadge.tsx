import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "../ui/AppText";

/**
 * The prostration sign is a source character (U+06E9) that remains in the
 * Arabic text. This badge repeats that character with a label so the sign is
 * not lost among a long verse, without changing or adding to Quranic text.
 */
export function SajdahBadge() {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.accentSoft, borderColor: colors.accent },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Verse of prostration, sajdah"
    >
      <Text
        style={[styles.glyph, { color: colors.accent, fontFamily: fonts.arabic }]}
        maxFontSizeMultiplier={1.2}
      >
        {"\u06e9"}
      </Text>
      <AppText variant="label" style={{ color: colors.accent }} maxFontSizeMultiplier={1.3}>
        Sajdah
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  glyph: {
    fontSize: 16,
    lineHeight: 20,
  },
});
