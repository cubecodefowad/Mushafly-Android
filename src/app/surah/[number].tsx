import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  ToastAndroid,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReaderAppearanceSheet } from "../../components/quran/ReaderAppearanceSheet";
import { TranslationPickerSheet } from "../../components/settings/TranslationPickerSheet";
import { SurahFooter } from "../../components/quran/SurahFooter";
import { SurahHeader } from "../../components/quran/SurahHeader";
import { TajweedLegend } from "../../components/quran/TajweedLegend";
import { VerseActionsSheet } from "../../components/quran/VerseActionsSheet";
import { VerseRow } from "../../components/quran/VerseRow";
import { AppHeader } from "../../components/ui/AppHeader";
import { AppText } from "../../components/ui/AppText";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/IconButton";
import { Screen } from "../../components/ui/Screen";
import { useAudio } from "../../features/audio/AudioProvider";
import { useLibrary } from "../../features/bookmarks/LibraryProvider";
import { useSurah } from "../../features/quran/hooks";
import { useSettings } from "../../features/settings/SettingsProvider";
import { useTheme } from "../../theme/ThemeProvider";
import type { Verse } from "../../types/quran";

const VIEWABILITY = { itemVisiblePercentThreshold: 35, minimumViewTime: 350 } as const;

// React Native no longer re-exports `ViewToken` from the package root; only the
// fields this screen reads are needed, so the shape is declared locally.
type ViewToken = { item: Verse; isViewable: boolean; index?: number | null };

function parsePositiveInteger(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function SurahReaderScreen() {
  const params = useLocalSearchParams<{ number?: string | string[]; verse?: string | string[] }>();
  const surahNumber = parsePositiveInteger(params.number);
  const requestedVerse = parsePositiveInteger(params.verse);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { settings, update } = useSettings();
  const { lastRead, isBookmarked, toggleBookmark, saveReadingPosition } = useLibrary();
  const audio = useAudio();
  const { data: surah, loading, error, retry } = useSurah(
    surahNumber ?? 0,
    settings.translation,
  );

  const [activeVerse, setActiveVerse] = useState(1);
  const [selected, setSelected] = useState<Verse | null>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const listRef = useRef<FlatList<Verse>>(null);
  const lastSaved = useRef(0);
  const surahNumberRef = useRef(surahNumber ?? 0);
  const activeVerseRef = useRef(1);
  const savePositionRef = useRef(saveReadingPosition);

  surahNumberRef.current = surahNumber ?? 0;
  activeVerseRef.current = activeVerse;
  savePositionRef.current = saveReadingPosition;

  const targetVerse =
    requestedVerse && surah && requestedVerse <= surah.meta.verseCount
      ? requestedVerse
      : null;

  const queue = useMemo<Verse[]>(() => {
    if (!surah) return [];
    return surah.bismillah ? [surah.bismillah, ...surah.verses] : surah.verses;
  }, [surah]);

  const scrollToVerse = useCallback(
    (verseNumber: number, animated = true) => {
      if (!surah) return;
      // The Bismillah is rendered in the list header, so verse indices match
      // `surah.verses` exactly.
      const index = surah.verses.findIndex((verse) => verse.number === verseNumber);
      if (index < 0) return;
      listRef.current?.scrollToIndex({ index, animated, viewPosition: 0.18 });
    },
    [surah],
  );

  const onScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    const offset = Math.max(0, info.averageItemLength * info.index);
    listRef.current?.scrollToOffset({ offset, animated: false });
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: info.index,
        animated: false,
        viewPosition: 0.18,
      });
    }, 140);
  }, []);

  useEffect(() => {
    if (!surah) return;
    setActiveVerse(targetVerse ?? 1);
    if (!targetVerse) return;
    const timer = setTimeout(() => {
      scrollToVerse(targetVerse, false);
      savePositionRef.current(surah.meta.number, targetVerse);
    }, 220);
    return () => clearTimeout(timer);
  }, [surah, targetVerse, scrollToVerse]);

  // Persist the final visible verse when leaving the reader.
  useEffect(() => {
    return () => {
      const number = surahNumberRef.current;
      const verse = activeVerseRef.current;
      if (number > 0 && verse > 0) {
        savePositionRef.current(number, verse);
      }
    };
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visible = viewableItems
        .filter((entry) => entry.isViewable && entry.item.number > 0)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
      if (!visible?.item) return;
      setActiveVerse(visible.item.number);
      const now = Date.now();
      if (now - lastSaved.current < 850) return;
      lastSaved.current = now;
      savePositionRef.current(surahNumberRef.current, visible.item.number);
    },
  ).current;

  // Follow the recitation: when playback starts or advances, bring the verse
  // being read to the upper part of the screen.
  const audioSurahNumber = audio.current?.surah.number;
  const audioVerseNumber = audio.current?.verse.number;
  useEffect(() => {
    if (!settings.followAudio) return;
    if (!surah || audioSurahNumber !== surah.meta.number) return;
    if (audioVerseNumber === undefined) return;
    if (audioVerseNumber === 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }
    scrollToVerse(audioVerseNumber, true);
    setActiveVerse(audioVerseNumber);
  }, [audioSurahNumber, audioVerseNumber, scrollToVerse, settings.followAudio, surah]);

  const onTogglePlay = useCallback(
    (verse: Verse) => {
      if (!surah) return;
      const isCurrent =
        audio.current?.surah.number === surah.meta.number &&
        audio.current.verse.number === verse.number;
      if (isCurrent) {
        audio.toggle();
        return;
      }
      audio.playVerse(surah.meta, verse, queue);
      setActiveVerse(verse.number);
      savePositionRef.current(surah.meta.number, verse.number);
    },
    [audio, queue, surah],
  );

  const onToggleBookmark = useCallback(
    (verse: Verse) => {
      if (!surah) return;
      void toggleBookmark(surah.meta.number, verse.number).then((added) => {
        void Haptics.selectionAsync().catch(() => {});
        if (Platform.OS === "android") {
          ToastAndroid.show(
            added
              ? `Bookmarked ${surah.meta.number}:${verse.number}`
              : `Removed bookmark ${surah.meta.number}:${verse.number}`,
            ToastAndroid.SHORT,
          );
        }
      });
    },
    [surah, toggleBookmark],
  );

  const onPlayBismillah = useCallback(() => {
    if (!surah?.bismillah) return;
    const isCurrent =
      audio.current?.surah.number === surah.meta.number &&
      audio.current.verse.number === 0;
    if (isCurrent) {
      audio.toggle();
      return;
    }
    audio.playVerse(surah.meta, surah.bismillah, queue);
  }, [audio, queue, surah]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Verse>) => {
      if (!surah) return null;
      return (
        <VerseRow
          surah={surah.meta}
          verse={item}
          settings={settings}
          active={activeVerse === item.number}
          playing={
            audio.current?.surah.number === surah.meta.number &&
            audio.current.verse.number === item.number &&
            audio.playing
          }
          bookmarked={isBookmarked(surah.meta.number, item.number)}
          onOpenActions={setSelected}
          onTogglePlay={onTogglePlay}
          onToggleBookmark={onToggleBookmark}
        />
      );
    },
    [activeVerse, audio.current, audio.playing, isBookmarked, onTogglePlay, onToggleBookmark, settings, surah],
  );

  const resumeVerse =
    lastRead && surah && lastRead.surahNumber === surah.meta.number
      ? lastRead.verseNumber
      : null;

  const progress = surah ? Math.max(0, Math.min(1, activeVerse / surah.meta.verseCount)) : 0;
  const selectedBookmarked =
    surah && selected ? isBookmarked(surah.meta.number, selected.number) : false;
  const selectedPlaying =
    Boolean(selected && surah) &&
    audio.current?.surah.number === surah?.meta.number &&
    audio.current?.verse.number === selected?.number &&
    audio.playing;

  if (!surahNumber || surahNumber > 114) {
    return (
      <Screen>
        <AppHeader title="Surah" />
        <EmptyState
          icon="alert-circle-outline"
          title="Surah not found"
          body="The requested surah number is not between 1 and 114."
          actionLabel="Back to the surahs"
          onAction={() => router.replace("/surahs")}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title={`Surah ${surahNumber}`} bordered={false} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <AppText variant="caption" tone="muted" style={styles.loadingText}>
            Loading the surah from the bundled data…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (error || !surah) {
    return (
      <Screen>
        <AppHeader title={`Surah ${surahNumber}`} />
        <EmptyState
          icon="alert-circle-outline"
          title="This surah could not be read"
          body={error ?? "The local Quran database did not return this surah."}
          actionLabel="Try again"
          onAction={retry}
        />
        <View style={styles.errorBack}>
          <Pressable
            onPress={() => router.replace("/surahs")}
            accessibilityRole="button"
            style={styles.errorBackButton}
          >
            <AppText variant="label" style={{ color: colors.accent }}>
              Return to the surah list
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const header = (
    <View>
      <SurahHeader
        surah={surah}
        settings={settings}
        onPlayBismillah={onPlayBismillah}
        playingBismillah={
          audio.current?.surah.number === surah.meta.number &&
          audio.current.verse.number === 0 &&
          audio.playing
        }
        onJumpToSajdah={(verseNumber) => {
          scrollToVerse(verseNumber);
          setActiveVerse(verseNumber);
          savePositionRef.current(surah.meta.number, verseNumber);
        }}
      />
      {settings.tajweed ? (
        <TajweedLegend
          rules={surah.tajweedRules}
          unavailableCount={surah.unavailableTajweedCount}
        />
      ) : null}
    </View>
  );

  const footer = (
    <View>
      <SurahFooter prev={surah.prev} next={surah.next} />
    </View>
  );

  return (
    <Screen edges={["top", "left", "right"]}>
      {focusMode ? null : (
        <AppHeader
          title={surah.meta.name}
          subtitle={`Verse ${activeVerse} of ${surah.meta.verseCount}`}
          right={
            <View style={styles.toolbarActions}>
              <IconButton
                icon="search-outline"
                label="Search the Quran"
                onPress={() => router.push("/search")}
                size={19}
              />
              <IconButton
                icon="language-outline"
                label={
                  settings.showTranslation ? "Hide translation" : "Show translation"
                }
                active={settings.showTranslation}
                onPress={() => update({ showTranslation: !settings.showTranslation })}
                size={19}
              />
              <IconButton
                icon="text-outline"
                label="Reading appearance"
                onPress={() => setAppearanceOpen(true)}
                size={19}
              />
              <IconButton
                icon="expand-outline"
                label="Enter focus mode"
                onPress={() => setFocusMode(true)}
                size={19}
              />
            </View>
          }
        />
      )}
      {focusMode ? null : (
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, width: `${progress * 100}%` },
            ]}
          />
        </View>
      )}

      {focusMode ? (
        <View style={styles.focusExit}>
          <IconButton
            icon="contract-outline"
            label="Exit focus mode"
            onPress={() => setFocusMode(false)}
            size={19}
          />
        </View>
      ) : null}

      {!focusMode && resumeVerse && resumeVerse > 1 && resumeVerse !== targetVerse ? (
        <View style={styles.resumeWrap}>
          <Pressable
            onPress={() => {
              scrollToVerse(resumeVerse);
              setActiveVerse(resumeVerse);
              savePositionRef.current(surah.meta.number, resumeVerse);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Resume at verse ${resumeVerse}`}
            style={({ pressed }) => [
              styles.resume,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.accent,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Icon name="time-outline" size={15} color={colors.accent} />
            <AppText variant="label" style={{ color: colors.accent }}>
              Resume at verse {resumeVerse}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={surah.verses}
        keyExtractor={(item) => `${item.surahNumber}:${item.number}`}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        onScrollToIndexFailed={onScrollToIndexFailed}
        contentContainerStyle={{
          paddingBottom: (audio.current ? 150 : 28) + insets.bottom,
        }}
      />

      <ReaderAppearanceSheet
        visible={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        onOpenTranslation={() => {
          setAppearanceOpen(false);
          setTranslationOpen(true);
        }}
      />
      <TranslationPickerSheet
        visible={translationOpen}
        value={settings.translation}
        onClose={() => setTranslationOpen(false)}
        onChange={(translation) => update({ translation })}
      />
      <VerseActionsSheet
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        surah={surah.meta}
        verse={selected}
        settings={settings}
        bookmarked={selectedBookmarked}
        playing={selectedPlaying}
        onToggleBookmark={() => {
          if (selected) onToggleBookmark(selected);
        }}
        onPlay={() => {
          if (selected) onTogglePlay(selected);
          setSelected(null);
        }}
        onPause={() => {
          audio.toggle();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    marginTop: 2,
  },
  errorBack: {
    alignItems: "center",
    paddingBottom: 24,
  },
  errorBackButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  focusExit: {
    position: "absolute",
    top: 6,
    right: 8,
    zIndex: 2,
  },
  progressTrack: {
    height: 2,
  },
  progressFill: {
    height: 2,
  },
  resumeWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
  resume: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
});
