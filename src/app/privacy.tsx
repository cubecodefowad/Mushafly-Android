import { router } from "expo-router";
import * as Linking from "expo-linking";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "../components/ui/AppHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Screen";
import { useTheme } from "../theme/ThemeProvider";

const CONTACT = "hello@mushafly.com";

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

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <AppHeader title="Privacy Policy" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="meta" tone="muted">
          Legal
        </AppText>
        <AppText variant="display" style={styles.title}>
          Privacy Policy
        </AppText>
        <AppText tone="muted" style={styles.intro}>
          Mushafly for Android is an offline reader. There is no account, no
          advertising, no analytics and no tracking. This page states exactly what is
          stored, where it is stored, and what leaves your device.
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.effective}>
          Effective 20 October 2026.
        </AppText>

        <Section title="What is stored on this device">
          <AppText tone="muted" style={styles.body}>
            Bookmarks, your last-read position and reading preferences (type sizes,
            theme, translation dataset and Tajweed toggle) are written to two SQLite
            databases in the app&apos;s private storage:
          </AppText>
          <AppText tone="muted" style={styles.listItem}>
            · mushafly-user.db holds bookmarks, the reading position and settings.
          </AppText>
          <AppText tone="muted" style={styles.listItem}>
            · quran.db is a read-only copy of the bundled Quran text. It contains no
            information about you.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            This data never leaves your device. It is not synchronised, uploaded or
            backed up. Settings → Reset reading settings restores the defaults;
            bookmarks and the reading position are removed by clearing the app&apos;s
            storage in Android settings, or by uninstalling the app.
          </AppText>
        </Section>

        <Section title="Measurement">
          <AppText tone="muted" style={styles.body}>
            The Android app records no analytics, no crash reports, no advertising
            identifier and no device fingerprint. It makes no request to a Mushafly
            server, because it has no server. Nothing you read, search, bookmark or set
            is transmitted anywhere.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            The Mushafly website is a separate product with its own cookieless page
            counting. That measurement is not part of this app and cannot see your
            reading here.
          </AppText>
        </Section>

        <Section title="Network requests the app makes">
          <AppText tone="muted" style={styles.body}>
            Reading, search, bookmarks, settings, the translation picker and every
            reference page work without a network connection.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            The only request is recitation audio, and only when you press play. Verses
            are streamed as MP3 files from raw.githubusercontent.com, so GitHub sees
            your IP address and user agent and handles that data under its own privacy
            statement. If you never play a verse, the app makes no network request at
            all.
          </AppText>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
              ).catch(() => {})
            }
            accessibilityRole="link"
            style={styles.linkRow}
          >
            <AppText variant="label" style={{ color: colors.accent }}>
              GitHub&apos;s privacy statement
            </AppText>
          </Pressable>
        </Section>

        <Section title="Permissions">
          <AppText tone="muted" style={styles.body}>
            The app requests no Android permissions. It does not use the microphone,
            camera, contacts, location, notifications, background playback or
            foreground services.
          </AppText>
        </Section>

        <Section title="Retention and your choices">
          <AppText tone="muted" style={styles.body}>
            We hold no personal data about you, so there is nothing for us to delete,
            export or correct on our side. Everything Mushafly knows about your reading
            lives on your device and stays under your control.
          </AppText>
          <AppText tone="muted" style={styles.body}>
            If storage cannot be written, the reader, search and navigation keep
            working; only bookmarks and saved preferences are unavailable for that
            session, and Settings says so.
          </AppText>
        </Section>

        <Section title="Changes to this policy">
          <AppText tone="muted" style={styles.body}>
            If a future version collects anything new, this page will be updated before
            that version ships and the effective date above will change. The
            application is open source, so the behaviour described here can be checked
            against the code you are running.
          </AppText>
        </Section>

        <AppText tone="muted" style={styles.contact}>
          Questions about this policy can be sent to{" "}
          <AppText
            variant="label"
            style={{ color: colors.accent }}
            onPress={() => void Linking.openURL(`mailto:${CONTACT}`).catch(() => {})}
          >
            {CONTACT}
          </AppText>
          .
        </AppText>

        <View style={styles.nav}>
          <Pressable
            onPress={() => router.push("/terms")}
            accessibilityRole="button"
            style={[styles.navButton, { borderColor: colors.border }]}
          >
            <AppText variant="label">Terms of Service</AppText>
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
  listItem: {
    marginTop: 8,
    lineHeight: 21,
  },
  linkRow: {
    marginTop: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  contact: {
    marginTop: 28,
    lineHeight: 21,
  },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 24,
  },
  navButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
