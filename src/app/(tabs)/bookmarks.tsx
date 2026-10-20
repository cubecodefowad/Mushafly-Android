import { router } from "expo-router";
import { Alert, ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../components/ui/AppText";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/IconButton";
import { Screen } from "../../components/ui/Screen";
import { SajdahBadge } from "../../components/quran/SajdahBadge";
import { useBookmarkDetails } from "../../features/bookmarks/useBookmarkDetails";
import { useLibrary } from "../../features/bookmarks/LibraryProvider";
import { useSurahList } from "../../features/quran/hooks";
import { translationInfo } from "../../features/settings/settings";
import { useSettings } from "../../features/settings/SettingsProvider";
import { useTheme } from "../../theme/ThemeProvider";
import type { BookmarkRecord } from "../../types/quran";
import { formatDate, surahHref } from "../../utils/reference";

export default function BookmarksScreen() {
  const { colors, fonts } = useTheme();
  const { settings } = useSettings();
  const { bookmarks, loaded, error, removeSavedBookmark } = useLibrary();
  const { data: surahs } = useSurahList();
  const details = useBookmarkDetails(settings.translation);
  const translationIsRtl = translationInfo(settings.translation).direction === "rtl";

  const remove = (bookmark: BookmarkRecord) => {
    Alert.alert(
      "Remove bookmark?",
      `Surah ${bookmark.surahNumber}, verse ${bookmark.verseNumber} will be removed from this device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void removeSavedBookmark(bookmark.surahNumber, bookmark.verseNumber);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="meta" tone="muted">
          Saved on this device
        </AppText>
        <AppText variant="display" style={styles.title}>
          Bookmarks
        </AppText>
        <AppText tone="muted" style={styles.subtitle}>
          {bookmarks.length === 0
            ? "No bookmarks yet. Open a verse and tap the bookmark action to keep it here."
            : `${bookmarks.length} saved verse${bookmarks.length === 1 ? "" : "s"}. Bookmarks survive app restarts and data updates.`}
        </AppText>
      </View>

      {!loaded ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Bookmarks could not be loaded"
          body={error}
        />
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => `${item.surahNumber}:${item.verseNumber}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No bookmarks yet"
              body="Bookmark a verse while reading and it will appear here, with the surah and verse number stored as a stable reference."
              actionLabel="Browse surahs"
              onAction={() => router.push("/surahs")}
            />
          }
          renderItem={({ item }) => {
            const preview = details.details.get(
              `${item.surahNumber}:${item.verseNumber}`,
            );
            const meta = surahs?.find((entry) => entry.number === item.surahNumber);
            const surahName = preview?.surahName ?? meta?.name ?? `Surah ${item.surahNumber}`;
            const arabicName = preview?.surahArabicName ?? meta?.arabicName ?? "";
            const translation = preview?.translation ?? null;
            return (
              <Pressable
                onPress={() => router.push(surahHref(item.surahNumber, item.verseNumber))}
                accessibilityRole="button"
                accessibilityLabel={`${surahName}, verse ${item.verseNumber}`}
                android_ripple={{ color: colors.highlight }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                  },
                ]}
              >
                <View style={styles.topRow}>
                  <View style={styles.topCopy}>
                    <AppText variant="bodyMedium" numberOfLines={1}>
                      {surahName}
                    </AppText>
                    <AppText variant="caption" tone="muted" style={styles.ref}>
                      Surah {item.surahNumber} · verse {item.verseNumber} · saved{" "}
                      {formatDate(item.createdAt)}
                    </AppText>
                  </View>
                  {arabicName ? (
                    <AppText
                      numberOfLines={1}
                      style={[
                        styles.arabicName,
                        { color: colors.muted, fontFamily: fonts.arabic },
                      ]}
                    >
                      {arabicName}
                    </AppText>
                  ) : null}
                  <IconButton
                    icon="trash-outline"
                    label={`Remove bookmark for ${surahName} verse ${item.verseNumber}`}
                    onPress={() => remove(item)}
                    size={18}
                  />
                </View>

                {preview ? (
                  <>
                    {preview.hasSajdah ? (
                      <View style={styles.sajdah}>
                        <SajdahBadge />
                      </View>
                    ) : null}
                    <AppText
                      numberOfLines={2}
                      maxFontSizeMultiplier={1.25}
                      style={[styles.arabic, { color: colors.ink, fontFamily: fonts.arabic }]}
                    >
                      {preview.arabic}
                    </AppText>
                    {translation ? (
                      <AppText
                        numberOfLines={2}
                        maxFontSizeMultiplier={1.4}
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
                        {translation}
                      </AppText>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.previewLoading}>
                    {details.loading ? (
                      <ActivityIndicator color={colors.accent} size="small" />
                    ) : (
                      <Icon name="alert-circle-outline" size={16} color={colors.muted} />
                    )}
                    <AppText variant="caption" tone="muted">
                      {details.loading
                        ? "Loading the saved verse…"
                        : (details.error ?? "This verse could not be previewed.")}
                    </AppText>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 560,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: 30,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  topCopy: {
    flex: 1,
  },
  ref: {
    marginTop: 2,
  },
  arabicName: {
    maxWidth: "30%",
    fontSize: 21,
    lineHeight: 32,
    textAlign: "right",
    writingDirection: "rtl",
  },
  sajdah: {
    marginTop: 10,
  },
  arabic: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 45,
    textAlign: "right",
    writingDirection: "rtl",
  },
  translation: {
    marginTop: 6,
  },
  previewLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },
});
