import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SOURCE_INFO } from "../../data/generated/source";
import { useTheme } from "../../theme/ThemeProvider";
import { arabicLineHeight } from "../../theme/typography";
import { surahHref } from "../../utils/reference";
import type { SurahMeta } from "../../types/quran";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";

function AdjacentCard({
  meta,
  direction,
}: {
  meta: SurahMeta;
  direction: "prev" | "next";
}) {
  const { colors, fonts } = useTheme();
  const isPrev = direction === "prev";
  return (
    <Pressable
      onPress={() => router.replace(surahHref(meta.number))}
      accessibilityRole="button"
      accessibilityLabel={`${isPrev ? "Previous" : "Next"} surah ${meta.name}`}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [
        styles.adjacent,
        {
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.adjacentLabel, { justifyContent: isPrev ? "flex-start" : "flex-end" }]}>
        {isPrev ? <Icon name="arrow-back" size={14} color={colors.muted} /> : null}
        <AppText variant="caption" tone="muted">
          {isPrev ? "Previous surah" : "Next surah"}
        </AppText>
        {!isPrev ? <Icon name="arrow-forward" size={14} color={colors.muted} /> : null}
      </View>
      <View style={[styles.adjacentRow, isPrev ? null : { flexDirection: "row-reverse" }]}>
        <AppText variant="bodyMedium" numberOfLines={1} style={styles.adjacentName}>
          {meta.name}
        </AppText>
        <AppText
          numberOfLines={1}
          style={[
            styles.adjacentArabic,
            { color: colors.muted, fontFamily: fonts.arabic },
          ]}
        >
          {meta.arabicName}
        </AppText>
      </View>
    </Pressable>
  );
}

export function SurahFooter({
  prev,
  next,
}: {
  prev: SurahMeta | null;
  next: SurahMeta | null;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.navGrid}>
        {prev ? <AdjacentCard meta={prev} direction="prev" /> : <View style={styles.spacer} />}
        {next ? <AdjacentCard meta={next} direction="next" /> : null}
      </View>

      <View style={[styles.source, { borderTopColor: colors.border }]}>
        <AppText variant="meta" tone="muted">
          Source and attribution
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.sourceText}>
          Arabic, Tajweed annotations and audio: quranjson at revision{" "}
          {SOURCE_INFO.commit.slice(0, 7)} (MIT). English: Talal Itani (Tanzil.net).
          Indonesian: Indonesian Ministry of Religious Affairs (Tanzil.net).
          Commentary: Tafsir al-Muyassar, King Fahad Quran Complex
          (alquran.cloud). Recitation: {SOURCE_INFO.audio.reciter} (
          {SOURCE_INFO.audio.bitrate ?? "streamed"}).
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.sourceText}>
          Quranic text is rendered from the pinned source records. Search and
          highlighting never modify the displayed string. Recitation is streamed
          from the source and needs an internet connection.
        </AppText>
        <Pressable
          onPress={() => router.push("/about")}
          accessibilityRole="button"
          accessibilityLabel="Open Accuracy and Sources"
          style={styles.aboutLink}
        >
          <AppText variant="label" style={{ color: colors.accent }}>
            Accuracy and Sources
          </AppText>
          <Icon name="chevron-forward" size={15} color={colors.accent} />
        </Pressable>
        <AppText variant="caption" tone="muted" style={styles.disclaimer}>
          This app is a reading aid. For worship and study, verify the text
          against a printed Mushaf and the teaching you follow.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  navGrid: {
    flexDirection: "row",
    gap: 10,
  },
  spacer: {
    flex: 1,
  },
  adjacent: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    minHeight: 90,
  },
  adjacentLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  adjacentRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  adjacentName: {
    flex: 1,
  },
  adjacentArabic: {
    fontSize: 20,
    lineHeight: arabicLineHeight(20),
    writingDirection: "rtl",
  },
  source: {
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sourceText: {
    marginTop: 8,
    lineHeight: 18,
  },
  aboutLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 40,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  disclaimer: {
    marginTop: 4,
    lineHeight: 18,
  },
});
