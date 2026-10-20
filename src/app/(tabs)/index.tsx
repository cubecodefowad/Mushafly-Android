import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ContinueReadingCard } from "../../components/home/ContinueReadingCard";
import { AppText } from "../../components/ui/AppText";
import { BrandMark } from "../../components/ui/BrandMark";
import { Card } from "../../components/ui/Card";
import { Icon, type IconName } from "../../components/ui/Icon";
import { Screen } from "../../components/ui/Screen";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { SOURCE_INFO } from "../../data/generated/source";
import { useLibrary } from "../../features/bookmarks/LibraryProvider";
import { useSurahList, useVersePreview } from "../../features/quran/hooks";
import { translationInfo } from "../../features/settings/settings";
import { useSettings } from "../../features/settings/SettingsProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { formatCount, surahHref } from "../../utils/reference";

function QuickLink({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [styles.quickPressable, pressed && { opacity: 0.82 }]}
    >
      <Card style={styles.quickCard}>
        <View style={[styles.quickIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name={icon} size={20} color={colors.accent} />
        </View>
        <AppText variant="bodyMedium" style={styles.quickTitle}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors, fonts } = useTheme();
  const { settings } = useSettings();
  const { lastRead, bookmarks, error: libraryError } = useLibrary();
  const { data: surahs, error: surahListError } = useSurahList();
  const meta = lastRead
    ? (surahs?.find((entry) => entry.number === lastRead.surahNumber) ?? null)
    : null;
  const preview = useVersePreview(
    lastRead?.surahNumber ?? null,
    lastRead?.verseNumber ?? null,
    settings.translation,
  );
  const translation = translationInfo(settings.translation);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.brandRow}>
          <BrandMark size={42} />
          <View style={styles.brandCopy}>
            <AppText variant="display" style={styles.brandName}>
              Mushafly
            </AppText>
            <AppText variant="caption" tone="muted">
              A quiet place to read the Quran
            </AppText>
          </View>
        </View>

        <View style={styles.hero}>
          <AppText variant="meta" tone="muted">
            Source-faithful · Offline reading
          </AppText>
          <AppText variant="display" style={styles.heroTitle}>
            Read the Quran, without distraction.
          </AppText>
          <AppText tone="muted" style={styles.heroBody}>
            All {SOURCE_INFO.counts.surahs} surahs and{" "}
            {formatCount(SOURCE_INFO.counts.verses)} numbered verses are bundled
            with the app, in the Uthmani Arabic of the pinned source. No account
            and no generated Quranic text.
          </AppText>
        </View>

        <View style={styles.continueWrap}>
          <ContinueReadingCard
            lastRead={lastRead}
            meta={meta}
            preview={preview.status === "ready" ? preview.data : null}
            previewLoading={preview.status === "loading"}
            previewError={preview.status === "error" ? preview.error : null}
            onContinue={() => {
              if (lastRead) {
                router.push(surahHref(lastRead.surahNumber, lastRead.verseNumber));
              }
            }}
            onStart={() => router.push(surahHref(1))}
            onBrowse={() => router.push("/surahs")}
            arabicFont={fonts.arabic}
            translationIsArabic={translation.direction === "rtl"}
            translationSize={settings.translationSize}
          />
        </View>

        <SectionHeader title="Explore" style={styles.section} />
        <View style={styles.grid}>
          <QuickLink
            icon="book-outline"
            title="Surahs"
            subtitle={`${SOURCE_INFO.counts.surahs} surahs`}
            onPress={() => router.push("/surahs")}
          />
          <QuickLink
            icon="search-outline"
            title="Search"
            subtitle="Arabic & translations"
            onPress={() => router.push("/search")}
          />
          <QuickLink
            icon="color-palette-outline"
            title="Tajweed"
            subtitle="Colours and marks"
            onPress={() => router.push("/tajweed")}
          />
          <QuickLink
            icon="bookmark-outline"
            title="Bookmarks"
            subtitle={
              bookmarks.length === 1 ? "1 saved verse" : `${bookmarks.length} saved verses`
            }
            onPress={() => router.push("/bookmarks")}
          />
          <QuickLink
            icon="options-outline"
            title="Settings"
            subtitle="Theme, type, audio"
            onPress={() => router.push("/settings")}
          />
        </View>

        {libraryError ? (
          <AppText variant="caption" tone="danger" style={styles.error}>
            {libraryError}
          </AppText>
        ) : null}
        {surahListError ? (
          <AppText variant="caption" tone="danger" style={styles.error}>
            {surahListError}
          </AppText>
        ) : null}

        <View style={[styles.source, { borderTopColor: colors.border }]}>
          <AppText variant="meta" tone="muted">
            The text is not ours
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.sourceText}>
            Arabic, Tajweed annotations and recitation: quranjson, pinned at{" "}
            {SOURCE_INFO.commit.slice(0, 7)} (MIT). Translations and commentary:{" "}
            {SOURCE_INFO.translations.length} datasets bundled from Tanzil.net and the
            pinned source. The website carries the full Tanzil registry.
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
          <View style={styles.legalRow}>
            {[
              { label: "Terms", href: "/terms" as const },
              { label: "Privacy", href: "/privacy" as const },
              { label: "Tajweed guide", href: "/tajweed" as const },
            ].map((entry) => (
              <Pressable
                key={entry.href}
                onPress={() => router.push(entry.href)}
                accessibilityRole="button"
                accessibilityLabel={entry.label}
                style={({ pressed }) => [
                  styles.legalChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                  },
                ]}
              >
                <AppText variant="caption" tone="muted">
                  {entry.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.7,
  },
  hero: {
    marginTop: 30,
  },
  heroTitle: {
    marginTop: 8,
    maxWidth: 460,
  },
  heroBody: {
    marginTop: 10,
    maxWidth: 520,
  },
  continueWrap: {
    marginTop: 26,
  },
  section: {
    marginTop: 34,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickPressable: {
    width: "48%",
    flexGrow: 1,
  },
  quickCard: {
    minHeight: 122,
    padding: 14,
    justifyContent: "space-between",
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: {
    marginTop: 10,
  },
  error: {
    marginTop: 14,
  },
  source: {
    marginTop: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
  },
  sourceText: {
    marginTop: 8,
    lineHeight: 18,
  },
  aboutLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 42,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  legalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  legalChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
