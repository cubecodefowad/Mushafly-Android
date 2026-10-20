import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "../components/ui/AppHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { Screen } from "../components/ui/Screen";
import { SajdahBadge } from "../components/quran/SajdahBadge";
import { DATA_LOCK, SOURCE_INFO } from "../data/generated/source";
import { SAJDAH_VERSES } from "../features/quran/text-marks";
import { groupedTranslations, translationLabel } from "../features/settings/settings";
import { useTheme } from "../theme/ThemeProvider";
import { formatCount, surahHref } from "../utils/reference";

const ISSUE_URL = "https://github.com/cubecodefowad/Mushafly-Android/issues";
const CONTACT = "hello@mushafly.com";

function LinkRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.linkCopy}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {value}
        </AppText>
      </View>
      <Icon name="open-outline" size={16} color={colors.accent} />
    </Pressable>
  );
}

export default function AboutScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <AppHeader title="Accuracy and Sources" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="meta" tone="muted">
          About this reading
        </AppText>
        <AppText variant="display" style={styles.title}>
          Accuracy and Sources
        </AppText>
        <AppText tone="muted" style={styles.intro}>
          Mushafly displays text it did not write. This page states where every
          part of it comes from, what has been checked, what has not, and how to
          report a possible problem. The reader bundles all{" "}
          {SOURCE_INFO.translations.length} datasets the website publishes, so every
          edition is available offline.
        </AppText>

        <Card style={styles.notice}>
          <AppText variant="heading">A note on accuracy</AppText>
          <AppText tone="muted" style={styles.noticeText}>
            We have taken great care to preserve the accuracy and integrity of the
            Quranic text and the translations presented in this application. The
            Quranic text and associated data are sourced from the project&apos;s
            documented sources, and we strive to display the content faithfully.
          </AppText>
          <AppText tone="muted" style={styles.noticeText}>
            Despite these efforts, errors or technical issues may occasionally
            occur. If you notice a possible discrepancy in the Quranic text,
            translation, recitation, or other content, please contact us so we can
            investigate it carefully. We appreciate your help in identifying
            potential issues and improving the application.
          </AppText>
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          Exactly what is pinned
        </AppText>
        <Card>
          <AppText variant="caption" tone="muted" style={styles.body}>
            The mobile database is generated from the Mushafly web application&apos;s
            validated runtime tree, itself derived from revision{" "}
            {SOURCE_INFO.commit.slice(0, 7)} of semarketir/quranjson. The complete
            database is bundled in the app so reading never needs a server.
          </AppText>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <AppText variant="label">Source</AppText>
          <AppText variant="caption" tone="muted" style={styles.body}>
            {SOURCE_INFO.repository} · {SOURCE_INFO.license} · commit{" "}
            {SOURCE_INFO.commit}
          </AppText>
          <AppText variant="label" style={styles.subLabel}>
            Content
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.body}>
            {SOURCE_INFO.counts.surahs} surahs ·{" "}
            {formatCount(SOURCE_INFO.counts.verses)} numbered verses ·{" "}
            {SOURCE_INFO.counts.arabicEntries} Arabic rows (including{" "}
            {SOURCE_INFO.counts.bismillahVerses} unnumbered Bismillah rows)
          </AppText>
          <AppText variant="label" style={styles.subLabel}>
            Translations
          </AppText>
          {groupedTranslations().map((group) => (
            <AppText key={group.label} variant="caption" tone="muted" style={styles.body}>
              {group.label}:{" "}
              {group.translations
                .map((entry) => `${translationLabel(entry)} (${entry.translator})`)
                .join(" · ")}
            </AppText>
          ))}
          <AppText variant="caption" tone="muted" style={styles.footnote}>
            Every bundled dataset is a third-party work under its own terms. Tanzil
            datasets are used under Tanzil.net&apos;s terms; the quranjson datasets
            under the MIT license with the attributions above.
          </AppText>
          <AppText variant="label" style={styles.subLabel}>
            Recitation and font
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.body}>
            {SOURCE_INFO.audio.reciter}, {SOURCE_INFO.audio.source},{" "}
            {SOURCE_INFO.audio.bitrate ?? "streamed"}. Arabic type: Amiri Quran,
            bundled under the SIL Open Font License.
          </AppText>
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          What the automated checks prove
        </AppText>
        <Card>
          {[
            "All 114 surahs are present, with 6,236 numbered verses and 112 unnumbered Bismillah rows.",
            "Every displayed Arabic string is byte-compared with the pinned source; the app does not normalize, trim or correct it.",
            "Verse identifiers are complete, unique and ordered, and translation keys align with their Arabic verses.",
            "All 60,841 Tajweed ranges are validated; a verse whose source ranges do not align is rendered as plain text, never repainted or guessed.",
            "The 15 sajdah references are derived from the source's U+06E9 character and checked exactly.",
            "Every Arabic code point the reader can display has a glyph in the bundled Amiri Quran font, including all pause marks and the sajdah sign.",
            "Search uses separate normalized columns; the reader never receives normalized Arabic.",
            "The database copied on first launch is hash-verified and opened read-only; a failure shows an explicit error instead of a blank page.",
          ].map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Icon name="checkmark-circle-outline" size={17} color={colors.accent} />
              <AppText variant="caption" tone="muted" style={styles.bulletText}>
                {item}
              </AppText>
            </View>
          ))}
          <AppText variant="caption" tone="muted" style={styles.footnote}>
            These checks prove fidelity to the selected source. They do not
            independently prove that the source is religiously correct.
          </AppText>
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          The prostration sign investigation
        </AppText>
        <Card>
          <View style={styles.sajdahHead}>
            <SajdahBadge />
            <AppText variant="caption" tone="muted" style={styles.sajdahHeadText}>
              The badge repeats the source U+06E9 sign with a label. The Arabic
              text itself is unchanged.
            </AppText>
          </View>
          <AppText variant="caption" tone="muted" style={styles.body}>
            The pinned data contains U+06E9 in exactly 15 verses. We traced the
            character through the source JSON, the Tajweed renderer, the bundled
            font and the rendered reader. In this revision the glyph is present
            in the bundled Amiri Quran font, and pixel checks of the web reader
            found visible ink at all 15 verse positions and in the reference key.
            The Android build adds a labelled sajdah badge beside each of those
            verses, so the sign is not left as a small unlabelled glyph at the
            end of a long line. The build validator fails if the character is
            missing from the source or the font.
          </AppText>
          <AppText variant="label" style={styles.subLabel}>
            The 15 verses in this source
          </AppText>
          <View style={styles.refGrid}>
            {SAJDAH_VERSES.map((entry) => (
              <Pressable
                key={`${entry.surah}:${entry.verse}`}
                onPress={() => router.push(surahHref(entry.surah, entry.verse))}
                accessibilityRole="button"
                accessibilityLabel={`Open surah ${entry.surah}, verse ${entry.verse}`}
                style={({ pressed }) => [
                  styles.refChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                  },
                ]}
              >
                <AppText variant="label" tone="muted">
                  {entry.surah}:{entry.verse}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="caption" tone="muted" style={styles.footnote}>
            These references are source-derived, not inferred from a screen
            index. They still deserve qualified review against a printed Mushaf.
          </AppText>
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          What is not verified here
        </AppText>
        <Card>
          {[
            "This build does not claim a complete manual comparison against a printed Mushaf. Source-fidelity tests preserve the selected text; they are not an independent religious verification.",
            "The 15 sajdah positions and the treatment of special marks are the highest-risk cases for manual review. They match the pinned source and render visibly, but a qualified reviewer should confirm them before publication.",
            "147 verses intentionally render without Tajweed colour because the supplied ranges are out of bounds or overlap. The source Arabic is still displayed in full.",
            "Recitation is streamed from the source and needs internet. The app does not include or claim offline audio.",
            "Translations can differ legitimately in wording and interpretation. A difference from another translation is not automatically a software defect.",
          ].map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Icon name="information-circle-outline" size={17} color={colors.muted} />
              <AppText variant="caption" tone="muted" style={styles.bulletText}>
                {item}
              </AppText>
            </View>
          ))}
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          Reporting a discrepancy
        </AppText>
        <Card>
          <AppText variant="caption" tone="muted" style={styles.body}>
            Please include the surah and verse number, what you see, and what you
            expect. Reports are checked against the pinned source record, so a
            precise reference is the fastest way to trace a possible issue.
          </AppText>
          <LinkRow
            label="Email"
            value={`${CONTACT} — please include the surah and verse`}
            onPress={() => void Linking.openURL(`mailto:${CONTACT}`).catch(() => {})}
          />
          <LinkRow
            label="Issue tracker"
            value={ISSUE_URL}
            onPress={() => void Linking.openURL(ISSUE_URL).catch(() => {})}
          />
          <LinkRow
            label="Source revision"
            value={`${SOURCE_INFO.repository}/tree/${SOURCE_INFO.commit}`}
            onPress={() =>
              void Linking.openURL(
                `${SOURCE_INFO.repository}/tree/${SOURCE_INFO.commit}`,
              ).catch(() => {})
            }
          />
          <LinkRow
            label="Bundled data lock"
            value={`${formatCount(DATA_LOCK.input.files)} input files · ${DATA_LOCK.input.treeSha256.slice(0, 16)}…`}
            onPress={() =>
              void Linking.openURL(
                "https://github.com/cubecodefowad/Mushafly-Android/blob/main/data/source-lock.json",
              ).catch(() => {})
            }
          />
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          Legal and reference
        </AppText>
        <Card padded={false} style={styles.linkCard}>
          {[
            { label: "Tajweed and Quranic marks", value: "Every colour and sign explained", href: "/tajweed" as const },
            { label: "Terms of Service", value: "What the app is and what it does not claim", href: "/terms" as const },
            { label: "Privacy Policy", value: "What is stored, and what leaves the device", href: "/privacy" as const },
          ].map((entry) => (
            <Pressable
              key={entry.href}
              onPress={() => router.push(entry.href)}
              accessibilityRole="button"
              accessibilityLabel={`${entry.label}. ${entry.value}`}
              android_ripple={{ color: colors.highlight }}
              style={({ pressed }) => [
                styles.legalRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                },
              ]}
            >
              <View style={styles.linkCopy}>
                <AppText variant="label">{entry.label}</AppText>
                <AppText variant="caption" tone="muted">
                  {entry.value}
                </AppText>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </Card>

        <AppText variant="caption" tone="muted" style={styles.bottomNote}>
          Potential software defects are handled separately from legitimate
          differences between translations. If a report is about translation
          wording, the response will name the dataset and translator rather than
          silently changing the source text.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    marginTop: 2,
  },
  intro: {
    marginTop: 8,
    maxWidth: 560,
  },
  notice: {
    marginTop: 22,
  },
  noticeText: {
    marginTop: 10,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 10,
  },
  body: {
    marginTop: 6,
    lineHeight: 19,
  },
  subLabel: {
    marginTop: 16,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
  },
  bulletText: {
    flex: 1,
    lineHeight: 19,
  },
  footnote: {
    marginTop: 14,
    lineHeight: 18,
  },
  sajdahHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sajdahHeadText: {
    flex: 1,
    lineHeight: 18,
  },
  refGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  refChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "transparent",
    marginTop: 6,
  },
  linkCopy: {
    flex: 1,
  },
  linkCard: {
    paddingHorizontal: 16,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  bottomNote: {
    marginTop: 22,
    lineHeight: 18,
  },
});
