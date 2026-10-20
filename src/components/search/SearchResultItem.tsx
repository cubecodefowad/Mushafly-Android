import { Pressable, StyleSheet, View } from "react-native";
import { translationInfo } from "../../features/settings/settings";
import { useSettings } from "../../features/settings/SettingsProvider";
import { useTheme } from "../../theme/ThemeProvider";
import type { SearchResult } from "../../types/quran";
import { AppText } from "../ui/AppText";
import { Pill } from "../ui/Pill";

export function SearchResultItem({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) {
  const { colors, fonts } = useTheme();
  const { settings } = useSettings();
  const translationIsRtl = translationInfo(settings.translation).direction === "rtl";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${result.surahName}, verse ${result.verseNumber}`}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          backgroundColor: pressed ? colors.surfaceMuted : "transparent",
        },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.titleWrap}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {result.surahName}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.ref}>
            Surah {result.surahNumber} · verse {result.verseNumber}
          </AppText>
        </View>
        <Pill tone="muted">
          {result.matchField === "arabic" ? "Arabic match" : "Translation match"}
        </Pill>
      </View>

      <AppText
        numberOfLines={3}
        maxFontSizeMultiplier={1.3}
        style={[
          styles.arabic,
          {
            color: colors.ink,
            fontFamily: fonts.arabic,
            fontSize: Math.min(26, Math.max(22, settings.arabicSize * 0.72)),
            lineHeight: Math.round(
              Math.min(26, Math.max(22, settings.arabicSize * 0.72)) * 1.9,
            ),
          },
        ]}
      >
        {result.arabic}
      </AppText>

      {result.translation ? (
        <AppText
          numberOfLines={3}
          maxFontSizeMultiplier={1.5}
          style={[
            styles.translation,
            {
              color: colors.muted,
              fontFamily: translationIsRtl ? fonts.arabic : fonts.serif,
              fontSize: settings.translationSize,
              lineHeight: Math.round(settings.translationSize * 1.6),
              textAlign: translationIsRtl ? "right" : "left",
              writingDirection: translationIsRtl ? "rtl" : "ltr",
            },
          ]}
        >
          {result.translation}
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted" style={styles.translation}>
          Translation unavailable for this result.
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  ref: {
    marginTop: 2,
  },
  arabic: {
    marginTop: 10,
    textAlign: "right",
    writingDirection: "rtl",
  },
  translation: {
    marginTop: 8,
  },
});
