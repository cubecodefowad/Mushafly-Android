import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { arabicLineHeight } from "../../theme/typography";
import type { SurahMeta } from "../../types/quran";
import { AppText } from "../ui/AppText";

export const SURAH_ROW_HEIGHT = 86;

export function SurahListItem({
  surah,
  onPress,
}: {
  surah: SurahMeta;
  onPress: () => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Surah ${surah.number}, ${surah.name}, ${surah.arabicName}, ${surah.verseCount} verses, ${surah.place}`}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          backgroundColor: pressed ? colors.surfaceMuted : "transparent",
        },
      ]}
    >
      <View style={[styles.number, { borderColor: colors.border }]}>
        <AppText
          variant="caption"
          tone="muted"
          style={{ fontVariant: ["tabular-nums"] }}
          maxFontSizeMultiplier={1.3}
        >
          {surah.number}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyMedium" numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {surah.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.meta}>
          {surah.place} · {surah.verseCount} verses
        </AppText>
      </View>
      <AppText
        numberOfLines={1}
        maxFontSizeMultiplier={1.25}
        style={[
          styles.arabic,
          { color: colors.ink, fontFamily: fonts.arabic },
        ]}
        accessibilityElementsHidden
      >
        {surah.arabicName}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: SURAH_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  number: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
  },
  meta: {
    marginTop: 3,
  },
  arabic: {
    maxWidth: "38%",
    fontSize: 24,
    lineHeight: arabicLineHeight(24),
    textAlign: "right",
    writingDirection: "rtl",
  },
});
