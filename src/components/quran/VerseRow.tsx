import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { translationInfo } from "../../features/settings/settings";
import { useTheme } from "../../theme/ThemeProvider";
import { ArabicText } from "./ArabicText";
import { SajdahBadge } from "./SajdahBadge";
import { TranslationText } from "./TranslationText";
import { AppText } from "../ui/AppText";
import { IconButton } from "../ui/IconButton";
import type { ReaderSettings, SurahMeta, Verse } from "../../types/quran";

type Props = {
  surah: SurahMeta;
  verse: Verse;
  settings: ReaderSettings;
  active: boolean;
  playing: boolean;
  bookmarked: boolean;
  onOpenActions: (verse: Verse) => void;
  onTogglePlay: (verse: Verse) => void;
  onToggleBookmark: (verse: Verse) => void;
};

function VerseRowComponent({
  surah,
  verse,
  settings,
  active,
  playing,
  bookmarked,
  onOpenActions,
  onTogglePlay,
  onToggleBookmark,
}: Props) {
  const { colors } = useTheme();
  const translation = verse.translation;
  const rtlTranslation = translationInfo(verse.translationLanguage).direction === "rtl";

  return (
    <Pressable
      onPress={() => onOpenActions(verse)}
      accessibilityRole="button"
      accessibilityLabel={`Surah ${surah.name}, verse ${verse.number}`}
      accessibilityHint="Opens verse actions"
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          backgroundColor: active
            ? colors.highlight
            : pressed
              ? colors.surfaceMuted
              : "transparent",
        },
      ]}
    >
      <View style={styles.metaRow}>
        <View
          style={[
            styles.number,
            { borderColor: active ? colors.accent : colors.border },
          ]}
        >
          <AppText
            variant="caption"
            style={{
              color: active ? colors.accent : colors.muted,
              fontVariant: ["tabular-nums"],
            }}
            maxFontSizeMultiplier={1.3}
          >
            {verse.number}
          </AppText>
        </View>

        {verse.hasSajdah ? <SajdahBadge /> : null}

        {playing ? (
          <AppText variant="meta" style={{ color: colors.accent }}>
            Playing
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <IconButton
            icon={playing ? "pause" : "play"}
            label={
              verse.audio
                ? `${playing ? "Pause" : "Play"} verse ${verse.number}`
                : `No recitation for verse ${verse.number}`
            }
            onPress={() => onTogglePlay(verse)}
            disabled={!verse.audio}
            active={playing}
            size={18}
          />
          <IconButton
            icon={bookmarked ? "bookmark" : "bookmark-outline"}
            label={
              bookmarked
                ? `Remove bookmark for verse ${verse.number}`
                : `Bookmark verse ${verse.number}`
            }
            onPress={() => onToggleBookmark(verse)}
            active={bookmarked}
            size={18}
          />
        </View>
      </View>

      <ArabicText
        text={verse.arabic}
        segments={verse.tajweed.segments}
        size={settings.arabicSize}
        showTajweed={settings.tajweed && verse.tajweed.status === "ok"}
        style={styles.arabic}
      />

      {settings.showTranslation ? (
        translation ? (
          <TranslationText
            text={translation}
            size={settings.translationSize}
            rtl={rtlTranslation}
            style={styles.translation}
          />
        ) : verse.number === 0 ? null : (
          <AppText variant="caption" tone="muted" style={styles.translation}>
            This dataset has no row for this verse.
          </AppText>
        )
      ) : null}
    </Pressable>
  );
}

export const VerseRow = memo(VerseRowComponent);

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 36,
  },
  number: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  arabic: {
    marginTop: 8,
  },
  translation: {
    marginTop: 10,
  },
});
