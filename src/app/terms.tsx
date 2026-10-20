import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "../components/ui/AppHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Screen";
import { SOURCE_INFO } from "../data/generated/source";
import { TRANSLATIONS } from "../features/settings/settings";
import { useTheme } from "../theme/ThemeProvider";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card>{children}</Card>
    </View>
  );
}

export default function TermsScreen() {
  const { colors } = useTheme();
  const languages = new Set(TRANSLATIONS.map((entry) => entry.group ?? entry.label)).size;

  return (
    <Screen>
      <AppHeader title="Terms of Service" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="meta" tone="muted">
          Legal
        </AppText>
        <AppText variant="display" style={styles.title}>
          Terms of Service
        </AppText>
        <AppText tone="muted" style={styles.intro}>
          These terms cover your use of Mushafly for Android, a free Quran reading
          application. By using it you accept them. If you do not accept them, please
          do not use the application.
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.effective}>
          Effective 20 October 2026.
        </AppText>

        <Section title="What Mushafly is">
          <AppText tone="muted" style={styles.body}>
            Mushafly displays Quranic text with {TRANSLATIONS.length} translation
            datasets across {languages} languages, including an Arabic commentary,
            source-derived Tajweed highlighting and verse-by-verse recitation. It is a
            reading tool. It is not a religious authority and it does not issue rulings,
            tafsir or religious guidance.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            The application is free. There is no subscription, no advertising and no
            account.
          </AppText>
        </Section>

        <Section title="The text you read here">
          <AppText tone="muted" style={styles.body}>
            All Quranic content — Arabic text, surah metadata, translations, the Arabic
            commentary, Tajweed ranges and audio — is taken unmodified from a single
            pinned open dataset and its upstream sources, currently revision{" "}
            {SOURCE_INFO.commit.slice(0, 7)} of {SOURCE_INFO.repository}. Mushafly does
            not generate, rewrite, correct, normalize or fill in Quranic text, and it
            never substitutes machine-generated content for it.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            The dataset is a third-party work. Translations and commentary come from
            Tanzil.net and the pinned quranjson source, and recitation is by{" "}
            {SOURCE_INFO.audio.reciter} from {SOURCE_INFO.audio.source}. Those are
            separate works under their own terms. Mushafly&apos;s own software is
            released under the MIT license.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            For worship and study, always verify against a printed Mushaf.
            Transcription, translation, Tajweed annotation and audio are human-made
            works and can contain errors. Where the dataset cannot be applied reliably,
            Mushafly shows the verse as plain text and says so instead of guessing. A
            clean build check means the app matches the pinned dataset; it is not a
            claim of textual authenticity.
          </AppText>
        </Section>

        <Section title="Acceptable use">
          <AppText tone="muted" style={styles.body}>
            You may read, search, bookmark and share the application, and you may
            redistribute it under the terms of its license.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            You must not present the translation, Tajweed annotation or audio as an
            authoritative Mushaf or as a religious ruling; modify Quranic text displayed
            by the application and present the result as Quran; use the application to
            harass, defame or misrepresent the content or any person or group; or use it
            in a way that is unlawful where you are.
          </AppText>
        </Section>

        <Section title="Your data and availability">
          <AppText tone="muted" style={styles.body}>
            Bookmarks, reading position and preferences belong to you and are stored
            locally on your device, as described in the Privacy Policy. Clearing the
            app&apos;s storage removes them, and we cannot restore them because we never
            receive them.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            Recitation audio is streamed from a third-party host and can be unavailable,
            especially offline. The application is provided &quot;as is&quot;, without
            warranties of any kind, and access may be changed, interrupted or
            discontinued at any time.
          </AppText>
        </Section>

        <Section title="Limitation of liability">
          <AppText tone="muted" style={styles.body}>
            To the fullest extent permitted by law, the authors and distributors of
            Mushafly are not liable for any loss arising from use of the application or
            reliance on the content it displays, including errors in a third-party
            dataset, unavailable audio, or data lost from your device.
          </AppText>
        </Section>

        <Section title="Changes to these terms">
          <AppText tone="muted" style={styles.body}>
            These terms may be updated as the application changes; the effective date
            above will change with them. Continued use after an update means you accept
            the current version.
          </AppText>
        </Section>

        <View style={styles.nav}>
          <Pressable
            onPress={() => router.push("/privacy")}
            accessibilityRole="button"
            style={[styles.navButton, { borderColor: colors.border }]}
          >
            <AppText variant="label">Privacy Policy</AppText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/about")}
            accessibilityRole="button"
            style={[styles.navButton, { borderColor: colors.border }]}
          >
            <AppText variant="label">Accuracy and Sources</AppText>
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
  effective: {
    marginTop: 8,
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  body: {
    marginTop: 8,
    lineHeight: 21,
  },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 26,
  },
  navButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
