import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import type { LastRead, SurahMeta } from "../../types/quran";
import type { VersePreview } from "../../features/quran/repository";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SajdahBadge } from "../quran/SajdahBadge";

export function ContinueReadingCard({
  lastRead,
  meta,
  preview,
  previewLoading,
  previewError,
  onContinue,
  onStart,
  onBrowse,
  arabicFont,
  translationFont,
  translationIsArabic,
  translationSize,
}: {
  lastRead: LastRead | null;
  meta: SurahMeta | null;
  preview: VersePreview | null;
  previewLoading: boolean;
  previewError: string | null;
  onContinue: () => void;
  onStart: () => void;
  onBrowse: () => void;
  arabicFont: string;
  translationFont: string;
  translationIsArabic: boolean;
  translationSize: number;
}) {
  const { colors } = useTheme();

  if (lastRead && !meta) {
    return (
      <Card style={styles.emptyCard}>
        <AppText variant="meta" tone="muted">
          Continue reading
        </AppText>
        <AppText variant="title" style={styles.emptyTitle}>
          Surah {lastRead.surahNumber}
        </AppText>
        <AppText tone="muted" style={styles.emptyBody}>
          Your saved position is verse {lastRead.verseNumber}. The surah metadata
          is still loading, but the position is stored by surah and verse number.
        </AppText>
        <View style={styles.emptyActions}>
          <Button label="Continue reading" onPress={onContinue} compact />
        </View>
      </Card>
    );
  }

  if (!lastRead || !meta) {
    return (
      <Card style={styles.emptyCard}>
        <AppText variant="meta" tone="muted">
          Begin reading
        </AppText>
        <AppText variant="title" style={styles.emptyTitle}>
          Start with Al-Fatiha
        </AppText>
        <AppText tone="muted" style={styles.emptyBody}>
          There is no saved reading position yet. Open the first surah, or browse
          all 114. Your place is saved locally as you read.
        </AppText>
        <View style={styles.emptyActions}>
          <Button label="Open Al-Fatiha" onPress={onStart} compact />
          <Button label="Browse surahs" onPress={onBrowse} variant="secondary" compact />
        </View>
      </Card>
    );
  }

  const progress = Math.max(0, Math.min(1, lastRead.verseNumber / meta.verseCount));

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <AppText variant="meta" tone="muted">
              Continue reading
            </AppText>
            <AppText variant="title" style={styles.title} numberOfLines={1}>
              {meta.name}
            </AppText>
            <AppText variant="caption" tone="muted">
              Verse {lastRead.verseNumber} of {meta.verseCount}
            </AppText>
          </View>
          <AppText
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[styles.arabicName, { color: colors.ink, fontFamily: arabicFont }]}
          >
            {meta.arabicName}
          </AppText>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, width: `${progress * 100}%` },
            ]}
          />
        </View>

        {preview ? (
          <View style={styles.preview}>
            {preview.hasSajdah ? <SajdahBadge /> : null}
            <AppText
              numberOfLines={2}
              maxFontSizeMultiplier={1.25}
              style={[styles.previewArabic, { color: colors.ink, fontFamily: arabicFont }]}
            >
              {preview.arabic}
            </AppText>
            {preview.translation ? (
              <AppText
                numberOfLines={2}
                maxFontSizeMultiplier={1.4}
                style={[
                  styles.previewTranslation,
                  {
                    color: colors.muted,
                    fontFamily: translationFont,
                    fontSize: translationSize,
                    lineHeight: Math.round(translationSize * 1.65),
                    textAlign: translationIsArabic ? "right" : "left",
                    writingDirection: translationIsArabic ? "rtl" : "ltr",
                  },
                ]}
              >
                {preview.translation}
              </AppText>
            ) : null}
          </View>
        ) : previewLoading ? (
          <View style={styles.previewStatus}>
            <ActivityIndicator color={colors.accent} size="small" />
            <AppText variant="caption" tone="muted">
              Loading the saved verse…
            </AppText>
          </View>
        ) : previewError ? (
          <AppText variant="caption" tone="muted" style={styles.previewError}>
            The saved verse could not be previewed. Your position is still saved
            and Continue will open it.
          </AppText>
        ) : null}

        <View style={styles.action}>
          <Button
            label={`Continue at ${meta.name} ${lastRead.verseNumber}`}
            onPress={onContinue}
            icon="arrow-forward"
            accessibilityLabel={`Continue reading ${meta.name} at verse ${lastRead.verseNumber}`}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  body: {
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    marginTop: 4,
  },
  arabicName: {
    maxWidth: "42%",
    fontSize: 26,
    lineHeight: 42,
    textAlign: "right",
    writingDirection: "rtl",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  preview: {
    marginTop: 24,
  },
  previewArabic: {
    marginTop: 6,
    fontSize: 25,
    lineHeight: 47,
    textAlign: "right",
    writingDirection: "rtl",
  },
  previewTranslation: {
    marginTop: 6,
  },
  previewStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
  },
  previewError: {
    marginTop: 18,
  },
  action: {
    marginTop: 22,
  },
  emptyCard: {
    padding: 18,
  },
  emptyTitle: {
    marginTop: 6,
  },
  emptyBody: {
    marginTop: 8,
    maxWidth: 480,
  },
  emptyActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
});
