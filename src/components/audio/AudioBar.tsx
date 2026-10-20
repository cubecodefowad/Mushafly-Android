import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { arabicLineHeight } from "../../theme/typography";
import { useAudio, useAudioProgress } from "../../features/audio/AudioProvider";
import { formatTimestamp } from "../../utils/reference";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";

export function AudioBar({ bottomOffset }: { bottomOffset: number }) {
  const { colors, fonts } = useTheme();
  const audio = useAudio();
  const { status, seek } = useAudioProgress();
  const [trackWidth, setTrackWidth] = useState(0);
  const [retrying, setRetrying] = useState(false);

  if (!audio.current) return null;

  const { current, playing, loading, error } = audio;
  const duration = status.duration;
  const position = Math.min(status.currentTime, duration || status.currentTime);
  const progress = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
  const index = current.queue.findIndex((verse) => verse.number === current.verse.number);
  const canPrevious = index > 0 || position > 3;
  const canNext = index >= 0 && index < current.queue.length - 1;
  const label =
    current.verse.number === 0
      ? "Bismillah"
      : `Verse ${current.verse.number} of ${current.surah.verseCount}`;

  const seekToRatio = (ratio: number) => {
    if (duration <= 0) return;
    void seek(Math.max(0, Math.min(duration, ratio * duration)));
  };

  const onPressTrack = (event: GestureResponderEvent) => {
    if (trackWidth <= 0) return;
    seekToRatio(event.nativeEvent.locationX / trackWidth);
  };

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "increment") {
      void seek(Math.min(duration || Infinity, position + 10));
    } else if (event.nativeEvent.actionName === "decrement") {
      void seek(Math.max(0, position - 10));
    }
  };

  const retry = () => {
    setRetrying(true);
    audio.playVerse(current.surah, current.verse, current.queue);
    setTimeout(() => setRetrying(false), 800);
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          bottom: bottomOffset,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <AppText variant="label" numberOfLines={1}>
            {current.surah.name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {label}
          </AppText>
        </View>
        <AppText
          numberOfLines={1}
          style={[
            styles.arabic,
            { color: colors.muted, fontFamily: fonts.arabic },
          ]}
          maxFontSizeMultiplier={1.2}
        >
          {current.surah.arabicName}
        </AppText>
        <IconButton icon="close" label="Stop recitation" onPress={audio.stop} size={18} />
      </View>

      <Pressable
        onPress={onPressTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel="Recitation progress"
        accessibilityValue={{
          min: 0,
          max: Math.max(1, Math.round(duration)),
          now: Math.round(position),
          text: `${formatTimestamp(position)} of ${formatTimestamp(duration)}`,
        }}
        accessibilityActions={[{ name: "increment", label: "Forward 10 seconds" }, { name: "decrement", label: "Back 10 seconds" }]}
        onAccessibilityAction={onAccessibilityAction}
        style={styles.trackHit}
      >
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.accent, width: `${progress * 100}%` },
            ]}
          />
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.accent,
                left: `${progress * 100}%`,
                opacity: duration > 0 ? 1 : 0,
              },
            ]}
          />
        </View>
      </Pressable>

      {error ? (
        <View style={styles.errorRow}>
          <Icon name="cloud-offline-outline" size={15} color={colors.danger} />
          <AppText variant="caption" style={{ color: colors.danger, flex: 1 }} numberOfLines={2}>
            {error}
          </AppText>
          <Pressable
            onPress={retry}
            disabled={retrying}
            accessibilityRole="button"
            accessibilityLabel="Retry recitation"
            hitSlop={6}
          >
            <AppText variant="label" style={{ color: colors.accent }}>
              Retry
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.bottomRow}>
          <IconButton
            icon="play-skip-back"
            label="Previous verse"
            onPress={audio.previous}
            disabled={!canPrevious}
            size={19}
          />
          <Pressable
            onPress={audio.toggle}
            accessibilityRole="button"
            accessibilityLabel={playing ? "Pause recitation" : "Play recitation"}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {loading || retrying ? (
              <ActivityIndicator color={colors.paper} size="small" />
            ) : (
              <Icon name={playing ? "pause" : "play"} size={22} color={colors.paper} />
            )}
          </Pressable>
          <IconButton
            icon="play-skip-forward"
            label="Next verse"
            onPress={audio.next}
            disabled={!canNext}
            size={19}
          />
          <AppText
            variant="caption"
            tone="muted"
            style={styles.time}
            maxFontSizeMultiplier={1.3}
          >
            {formatTimestamp(position)} / {formatTimestamp(duration)}
          </AppText>
          <AppText variant="meta" tone="muted" style={styles.streamLabel}>
            Streamed
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleWrap: {
    flex: 1,
  },
  arabic: {
    maxWidth: "34%",
    fontSize: 20,
    lineHeight: arabicLineHeight(20),
    writingDirection: "rtl",
    textAlign: "right",
  },
  trackHit: {
    paddingVertical: 10,
    justifyContent: "center",
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    top: -3,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 5,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    marginLeft: 4,
    fontVariant: ["tabular-nums"],
  },
  streamLabel: {
    marginLeft: "auto",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
  },
});
