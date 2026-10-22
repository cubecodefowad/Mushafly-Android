import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { translationInfo } from "../../features/settings/settings";
import type { ReaderSettings, Surah } from "../../types/quran";
import { ArabicText } from "./ArabicText";
import { MarkGlyph } from "./MarkGlyph";
import { TranslationText } from "./TranslationText";
import { AppText } from "../ui/AppText";
import { IconButton } from "../ui/IconButton";
import { Ornament } from "../ui/Ornament";
import { Pill } from "../ui/Pill";

export function SurahHeader({
  surah,
  settings,
  onPlayBismillah,
  playingBismillah,
  onJumpToSajdah,
}: {
  surah: Surah;
  settings: ReaderSettings;
  onPlayBismillah: () => void;
  playingBismillah: boolean;
  onJumpToSajdah: (verseNumber: number) => void;
}) {
  const { colors } = useTheme();
  const bismillah = surah.bismillah;
  const bismillahTranslation = bismillah?.translation ?? null;
  const translationIsRtl = translationInfo(settings.translation).direction === "rtl";
  const sajdahVerses = surah.verses.filter((verse) => verse.hasSajdah).map((verse) => verse.number);

  return (
    <View style={styles.wrap}>
      <AppText variant="meta" tone="muted" style={styles.meta}>
        Surah {surah.meta.number} · {surah.meta.place} · {surah.meta.verseCount} verses
      </AppText>

      <ArabicText
        text={surah.meta.arabicName}
        size={46}
        center
        style={styles.arabicName}
        accessibilityLabel={`${surah.meta.name} in Arabic`}
      />
      <AppText variant="title" style={styles.name} maxFontSizeMultiplier={1.4}>
        {surah.meta.name}
      </AppText>
      <View style={styles.ornament}>
        <Ornament />
      </View>

      {bismillah ? (
        <View style={styles.bismillahBlock}>
          <View style={styles.bismillahMeta}>
            <AppText variant="meta" tone="muted">
              Bismillah
            </AppText>
            <IconButton
              icon={playingBismillah ? "pause" : "play"}
              label={
                playingBismillah
                  ? "Pause the Bismillah recitation"
                  : "Play the Bismillah recitation"
              }
              onPress={onPlayBismillah}
              disabled={!bismillah.audio}
              active={playingBismillah}
              size={17}
            />
          </View>
          <ArabicText
            text={bismillah.arabic}
            segments={bismillah.tajweed.segments}
            size={Math.round(settings.arabicSize * 0.86)}
            showTajweed={settings.tajweed && bismillah.tajweed.status === "ok"}
            center
            style={styles.bismillah}
          />
          {settings.showTranslation && bismillahTranslation ? (
            <TranslationText
              text={bismillahTranslation}
              size={settings.translationSize}
              rtl={translationIsRtl}
              center
              style={styles.bismillahTranslation}
            />
          ) : null}
        </View>
      ) : null}

      {sajdahVerses.length > 0 ? (
        <View style={styles.sajdahRow}>
          {sajdahVerses.map((verseNumber) => (
            <Pressable
              key={verseNumber}
              onPress={() => onJumpToSajdah(verseNumber)}
              accessibilityRole="button"
              accessibilityLabel={`Jump to the sajdah in verse ${verseNumber}`}
              hitSlop={4}
            >
              <Pill
              icon={<MarkGlyph glyph="\u06E9" size={15} color={colors.accent} />}
            >
              Sajdah · verse {verseNumber}
            </Pill>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
  },
  meta: {
    textAlign: "center",
  },
  arabicName: {
    marginTop: 14,
  },
  name: {
    textAlign: "center",
    marginTop: 2,
  },
  ornament: {
    marginTop: 16,
  },
  bismillahBlock: {
    marginTop: 20,
    alignItems: "center",
  },
  bismillahMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bismillah: {
    marginTop: 2,
  },
  bismillahTranslation: {
    marginTop: 4,
    textAlign: "center",
    maxWidth: 420,
  },
  sajdahRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
});
