import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, ToastAndroid, View } from "react-native";
import { translationInfo } from "../../features/settings/settings";
import { useTheme } from "../../theme/ThemeProvider";
import { BottomSheet } from "../ui/BottomSheet";
import { AppText } from "../ui/AppText";
import { SajdahBadge } from "./SajdahBadge";
import { Icon, type IconName } from "../ui/Icon";
import type { ReaderSettings, SurahMeta, Verse } from "../../types/quran";

function ActionRow({
  icon,
  title,
  description,
  onPress,
  disabled = false,
  active = false,
}: {
  icon: IconName;
  title: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [
        styles.action,
        { borderColor: colors.border },
        pressed && !disabled && { backgroundColor: colors.surfaceMuted },
        disabled && { opacity: 0.45 },
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: active ? colors.accentSoft : colors.surfaceMuted },
        ]}
      >
        <Icon name={icon} size={19} color={active ? colors.accent : colors.muted} />
      </View>
      <View style={styles.actionCopy}>
        <AppText variant="bodyMedium">{title}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted" style={styles.actionDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function VerseActionsSheet({
  visible,
  onClose,
  surah,
  verse,
  settings,
  bookmarked,
  playing,
  onToggleBookmark,
  onPlay,
  onPause,
}: {
  visible: boolean;
  onClose: () => void;
  surah: SurahMeta;
  verse: Verse | null;
  settings: ReaderSettings;
  bookmarked: boolean;
  playing: boolean;
  onToggleBookmark: () => void;
  onPlay: () => void;
  onPause: () => void;
}) {
  const { colors, fonts } = useTheme();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setCopied(null);
  }, [visible, verse?.number]);

  if (!verse) return null;

  const translation = verse.translation;
  const dataset = translationInfo(verse.translationLanguage);
  const translateLabel = dataset.direction === "rtl" ? "Arabic commentary" : "translation";

  const copy = async (text: string | null, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    await Haptics.selectionAsync().catch(() => {});
    setCopied(label);
    if (Platform.OS === "android") {
      ToastAndroid.show(`${label} copied`, ToastAndroid.SHORT);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`${surah.name} · ${surah.number}:${verse.number}`}
      scroll
    >
      <View style={styles.reference}>
        <View style={styles.referenceCopy}>
          <AppText variant="caption" tone="muted">
            Verse {verse.number} of {surah.verseCount}
          </AppText>
          {verse.hasSajdah ? (
            <View style={styles.sajdah}>
              <SajdahBadge />
            </View>
          ) : null}
        </View>
        <AppText
          style={{
            fontFamily: fonts.arabic,
            color: colors.ink,
            fontSize: 26,
            lineHeight: 40,
            writingDirection: "rtl",
          }}
          maxFontSizeMultiplier={1.25}
        >
          {surah.arabicName}
        </AppText>
      </View>

      <ActionRow
        icon={playing ? "pause" : "play"}
        title={playing ? "Pause recitation" : "Play recitation"}
        description={
          verse.audio
            ? "Streamed from the pinned source · needs internet"
            : (verse.audioUnavailableReason ?? "No source audio for this verse")
        }
        onPress={playing ? onPause : onPlay}
        disabled={!verse.audio}
        active={playing}
      />
      <ActionRow
        icon={bookmarked ? "bookmark" : "bookmark-outline"}
        title={bookmarked ? "Remove bookmark" : "Bookmark this verse"}
        description={`Saved locally as ${surah.number}:${verse.number}`}
        onPress={onToggleBookmark}
        active={bookmarked}
      />
      <ActionRow
        icon="copy-outline"
        title="Copy Arabic text"
        description="Copies the exact source characters, including diacritics and marks"
        onPress={() => void copy(verse.arabic, "Arabic text")}
      />
      <ActionRow
        icon="copy-outline"
        title={`Copy ${translateLabel}`}
        description={
          translation
            ? `${dataset.shortName ?? dataset.name} · ${dataset.translator}`
            : "No text in this dataset for this verse"
        }
        onPress={() => void copy(translation, translateLabel)}
        disabled={!translation}
      />

      {copied ? (
        <AppText variant="caption" tone="accent" style={styles.copied}>
          Copied {copied}.
        </AppText>
      ) : null}

      <AppText variant="caption" tone="muted" style={styles.note}>
        Copying and bookmarking never modify the Quranic text. Recitation is
        streamed; the app does not claim offline audio.
      </AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  reference: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  referenceCopy: {
    flex: 1,
    paddingTop: 4,
  },
  sajdah: {
    marginTop: 8,
  },
  action: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: {
    flex: 1,
  },
  actionDescription: {
    marginTop: 2,
  },
  copied: {
    marginTop: 14,
  },
  note: {
    marginTop: 14,
  },
});
