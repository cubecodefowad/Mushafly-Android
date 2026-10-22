import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "../components/ui/AppHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { MarkGlyph } from "../components/quran/MarkGlyph";
import { Screen } from "../components/ui/Screen";
import { useTheme } from "../theme/ThemeProvider";
import { tajweedColor } from "../theme/palette";
import { TAJWEED_RULES } from "../features/quran/tajweed-rules";
import {
  ORTHOGRAPHIC_MARKS,
  SAJDAH_VERSES,
  TEXT_MARKS,
} from "../features/quran/text-marks";
import { surahHref } from "../utils/reference";

export default function TajweedReferenceScreen() {
  const { colors, scheme } = useTheme();

  return (
    <Screen>
      <AppHeader title="Tajweed and marks" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="meta" tone="muted">
          Reference
        </AppText>
        <AppText variant="display" style={styles.title}>
          Tajweed and marks
        </AppText>
        <AppText tone="muted" style={styles.intro}>
          The reader colours the letters that carry a Tajweed rule and leaves every
          pause mark in the source text untouched. This page explains each colour and
          each sign, so nothing on the page is unexplained.
        </AppText>

        <Card style={styles.notice}>
          <AppText variant="heading">How the colour is applied</AppText>
          <AppText tone="muted" style={styles.body}>
            The bundled annotation gives a character range for every rule. On Android
            each coloured run is shaped separately, which disconnects joined Arabic
            letters when a run starts in the middle of a word. The reader therefore
            starts colour only at a word edge or after a letter that does not join
            forward, and shows the whole span that the annotation touches. The Arabic
            itself is never altered, and letters always stay joined.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            147 verses are shown without colour because the upstream ranges do not fit
            their text or overlap each other. Those verses are labelled where they
            appear instead of being guessed at.
          </AppText>
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          The {Object.keys(TAJWEED_RULES).length} highlight colours
        </AppText>
        <Card>
          {Object.entries(TAJWEED_RULES).map(([key, rule]) => {
            const swatch = tajweedColor(key, scheme) ?? colors.accent;
            return (
              <View key={key} style={styles.ruleRow}>
                <View style={[styles.swatch, { backgroundColor: swatch }]} />
                <View style={styles.ruleCopy}>
                  <AppText variant="label">{rule.label}</AppText>
                  <AppText variant="caption" tone="muted" style={styles.ruleText}>
                    {rule.description}
                  </AppText>
                </View>
              </View>
            );
          })}
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          Signs printed in the text
        </AppText>
        <AppText tone="muted" style={styles.sectionBody}>
          These are characters in the Uthmani text, not interface buttons. They tell a
          reciter how to carry the sentence or divide the passage.
        </AppText>
        <Card>
          {TEXT_MARKS.map((mark) => (
            <View key={mark.glyph} style={styles.markRow}>
              <View
                style={[
                  styles.glyphBox,
                  { borderColor: colors.border, backgroundColor: colors.paper },
                ]}
              >
                <MarkGlyph glyph={mark.glyph} size={28} color={colors.ink} />
              </View>
              <View style={styles.ruleCopy}>
                <AppText variant="label">
                  {mark.name} · {mark.arabic}
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.ruleText}>
                  {mark.detail}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        <AppText variant="heading" style={styles.sectionTitle}>
          The fifteen prostration verses
        </AppText>
        <AppText tone="muted" style={styles.sectionBody}>
          Each reference below ends with the sajdah sign ({"\u06E9"}) in this text. Tap
          one to open it in the reader.
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
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                },
              ]}
            >
              <AppText variant="label" tone="muted">
                {entry.surah}:{entry.verse}
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="heading" style={styles.sectionTitle}>
          Small orthographic marks
        </AppText>
        <AppText tone="muted" style={styles.sectionBody}>
          The smallest signs belong to the spelling of the Uthmani text rather than to
          the pause system. They are not instructions to the reader.
        </AppText>
        <Card>
          {ORTHOGRAPHIC_MARKS.map((mark) => (
            <View key={mark.name} style={styles.markRow}>
              <View style={styles.glyphGroup}>
                {mark.glyphs.map((part) => (
                  <View
                    key={part.glyph}
                    style={[
                      styles.glyphBox,
                      { borderColor: colors.border, backgroundColor: colors.paper },
                    ]}
                  >
                    <MarkGlyph glyph={part.glyph} size={26} color={colors.ink} />
                  </View>
                ))}
              </View>
              <View style={styles.ruleCopy}>
                <AppText variant="label">{mark.name}</AppText>
                <AppText variant="caption" tone="muted" style={styles.ruleText}>
                  {mark.detail}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        <Card style={styles.notice}>
          <AppText variant="heading">A note on certainty</AppText>
          <AppText tone="muted" style={styles.body}>
            These meanings follow the conventional Madani Mushaf reading. They are a
            reading aid, not a ruling: for worship and study, verify against a printed
            Mushaf and the teaching you follow. If a symbol is unexplained or a
            highlight looks wrong, write to hello@mushafly.com.
          </AppText>
        </Card>

        <View style={styles.links}>
          <Pressable
            onPress={() => router.push("/about")}
            accessibilityRole="button"
            style={[styles.link, { borderColor: colors.border }]}
          >
            <Icon name="shield-checkmark-outline" size={16} color={colors.accent} />
            <AppText variant="label">Accuracy and sources</AppText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/surahs")}
            accessibilityRole="button"
            style={[styles.link, { borderColor: colors.border }]}
          >
            <Icon name="book-outline" size={16} color={colors.accent} />
            <AppText variant="label">Return to the surahs</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
  },
  title: {
    marginTop: 2,
  },
  intro: {
    marginTop: 8,
    lineHeight: 22,
  },
  notice: {
    marginTop: 22,
  },
  body: {
    marginTop: 10,
    lineHeight: 21,
  },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 10,
  },
  sectionBody: {
    marginTop: -2,
    marginBottom: 10,
    lineHeight: 20,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 9,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginTop: 3,
  },
  ruleCopy: {
    flex: 1,
  },
  ruleText: {
    marginTop: 2,
    lineHeight: 18,
  },
  markRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  glyphBox: {
    minWidth: 46,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  glyphGroup: {
    flexDirection: "row",
    gap: 6,
  },
  refGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  refChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 66,
    alignItems: "center",
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 28,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
