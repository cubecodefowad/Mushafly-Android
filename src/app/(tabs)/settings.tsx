import Constants from "expo-constants";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ReciterPickerSheet } from "../../components/settings/ReciterPickerSheet";
import { TranslationPickerSheet } from "../../components/settings/TranslationPickerSheet";
import { AppText } from "../../components/ui/AppText";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Screen } from "../../components/ui/Screen";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Segmented } from "../../components/ui/Segmented";
import { Stepper } from "../../components/ui/Stepper";
import { SwitchRow } from "../../components/ui/SwitchRow";
import { DATA_LOCK, SOURCE_INFO } from "../../data/generated/source";
import {
  EXCLUDED_RECITERS,
  RECITERS,
  reciterInfo,
} from "../../features/audio/reciters";
import {
  SETTINGS_LIMITS,
  TRANSLATIONS,
  adjustSize,
  translationInfo,
  translationLabel,
} from "../../features/settings/settings";
import { useSettings } from "../../features/settings/SettingsProvider";
import { useTheme } from "../../theme/ThemeProvider";
import type { ThemePreference } from "../../types/quran";
import { formatCount } from "../../utils/reference";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const ISSUE_URL = "https://github.com/cubecodefowad/Mushafly-Android/issues";
const CONTACT = "hello@mushafly.com";

function InfoRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      <AppText variant="body" style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText
        variant="caption"
        tone="muted"
        style={styles.infoValue}
        numberOfLines={3}
      >
        {value}
      </AppText>
      {onPress ? <Icon name="chevron-forward" size={16} color={colors.muted} /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${value}`}
      android_ripple={{ color: colors.highlight }}
      style={({ pressed }) => [
        styles.infoRow,
        {
          borderBottomColor: colors.border,
          backgroundColor: pressed ? colors.surfaceMuted : "transparent",
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, update, reset, storageError } = useSettings();
  const activeTranslation = translationInfo(settings.translation);
  const activeReciter = reciterInfo(settings.reciter);
  const databaseMiB = (DATA_LOCK.output.databaseBytes / 1024 / 1024).toFixed(1);
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const [translationOpen, setTranslationOpen] = useState(false);
  const [reciterOpen, setReciterOpen] = useState(false);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="meta" tone="muted">
          Reading and appearance
        </AppText>
        <AppText variant="display" style={styles.title}>
          Settings
        </AppText>
        <AppText tone="muted" style={styles.subtitle}>
          Every preference is stored on this device. There is no account, no
          synchronization and no cloud copy of your reading.
        </AppText>

        {storageError ? (
          <Card style={styles.errorCard}>
            <AppText variant="label" tone="danger">
              Preferences could not be saved
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.errorText} selectable>
              {storageError}
            </AppText>
          </Card>
        ) : null}

        <SectionHeader title="Appearance" style={styles.section} />
        <Card>
          <AppText variant="meta" tone="muted">
            Theme
          </AppText>
          <Segmented
            options={THEME_OPTIONS}
            value={settings.theme}
            onChange={(theme) => update({ theme })}
            style={styles.control}
          />

          <View style={[styles.rule, { backgroundColor: colors.border }]} />

          <Stepper
            label="Arabic font size"
            description="Quranic text only, independent from the translation"
            value={settings.arabicSize}
            displayValue={`${settings.arabicSize} pt`}
            onDecrease={() =>
              update({
                arabicSize: adjustSize(
                  settings.arabicSize,
                  -SETTINGS_LIMITS.arabicSize.step,
                  SETTINGS_LIMITS.arabicSize,
                ),
              })
            }
            onIncrease={() =>
              update({
                arabicSize: adjustSize(
                  settings.arabicSize,
                  SETTINGS_LIMITS.arabicSize.step,
                  SETTINGS_LIMITS.arabicSize,
                ),
              })
            }
            canDecrease={settings.arabicSize > SETTINGS_LIMITS.arabicSize.min}
            canIncrease={settings.arabicSize < SETTINGS_LIMITS.arabicSize.max}
          />
          <Stepper
            label="Translation font size"
            description="The selected translation, commentary or tafsir"
            value={settings.translationSize}
            displayValue={`${settings.translationSize} pt`}
            onDecrease={() =>
              update({
                translationSize: adjustSize(
                  settings.translationSize,
                  -SETTINGS_LIMITS.translationSize.step,
                  SETTINGS_LIMITS.translationSize,
                ),
              })
            }
            onIncrease={() =>
              update({
                translationSize: adjustSize(
                  settings.translationSize,
                  SETTINGS_LIMITS.translationSize.step,
                  SETTINGS_LIMITS.translationSize,
                ),
              })
            }
            canDecrease={settings.translationSize > SETTINGS_LIMITS.translationSize.min}
            canIncrease={settings.translationSize < SETTINGS_LIMITS.translationSize.max}
          />

          <View style={[styles.rule, { backgroundColor: colors.border }]} />

          <SwitchRow
            label="Show translation"
            description="The translation sits beneath each verse"
            value={settings.showTranslation}
            onValueChange={(showTranslation) => update({ showTranslation })}
          />
          <SwitchRow
            label="Tajweed highlighting"
            description="Source-derived colours; turning it off restores plain source text"
            value={settings.tajweed}
            onValueChange={(tajweed) => update({ tajweed })}
          />

          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <InfoRow
            label="Translation dataset"
            value={`${translationLabel(activeTranslation)} · ${activeTranslation.translator}`}
            onPress={() => setTranslationOpen(true)}
          />
          <AppText variant="caption" tone="muted" style={styles.help}>
            {TRANSLATIONS.length} datasets in {new Set(TRANSLATIONS.map((entry) => entry.group ?? entry.label)).size}{" "}
            languages are bundled offline. {activeTranslation.name} ·{" "}
            {activeTranslation.translator} · {activeTranslation.source}
            {activeTranslation.direction === "rtl"
              ? ". This is an Arabic commentary (tafsir), not a verse translation."
              : "."}
          </AppText>
        </Card>

        <SectionHeader title="Recitation" style={styles.section} />
        <Card>
          <SwitchRow
            label="Continue to the next verse"
            description="When a verse finishes, play the next one in the surah"
            value={settings.autoAdvanceAudio}
            onValueChange={(autoAdvanceAudio) => update({ autoAdvanceAudio })}
          />
          <SwitchRow
            label="Follow the recitation"
            description="Scroll the reader to the verse that is playing"
            value={settings.followAudio}
            onValueChange={(followAudio) => update({ followAudio })}
          />
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <InfoRow
            label="Reciter"
            value={`${activeReciter.name} · ${activeReciter.bitrate ?? "streamed"}`}
            onPress={() => setReciterOpen(true)}
          />
          <AppText variant="caption" tone="muted" style={styles.help}>
            {RECITERS.length} recitations are offered: Arabic Hafs, two Warsh
            readings and translated recitations.{" "}
            {activeReciter.folder
              ? `${activeReciter.name} streams one file per ayah from everyayah.com.`
              : `${activeReciter.name} is the pinned default, streamed per ayah from the source dataset.`}{" "}
            Changing reciter stops playback so the next verse starts from the
            source you chose.
          </AppText>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <AppText variant="caption" tone="muted" style={styles.audioNote}>
            Audio is streamed and needs an internet connection. The app does not
            bundle recitation files, does not download them, and does not claim
            offline audio. Pressing play offline explains that, and a stream that
            cannot start fails with a retry action instead of loading forever.
            Playback pauses when the app leaves the foreground. Only one
            recitation can play at a time.
          </AppText>
        </Card>

        <SectionHeader title="Data and sources" style={styles.section} />
        <Card padded={false} style={styles.infoCard}>
          <InfoRow label="Source repository" value="semarketir/quranjson · MIT" />
          <InfoRow label="Pinned revision" value={SOURCE_INFO.commit} />
          <InfoRow
            label="Content"
            value={`${SOURCE_INFO.counts.surahs} surahs · ${formatCount(
              SOURCE_INFO.counts.verses,
            )} numbered verses · ${SOURCE_INFO.counts.bismillahVerses} unnumbered Bismillah rows`}
          />
          <InfoRow
            label="Translations"
            value={`${TRANSLATIONS.length} datasets across ${new Set(
              TRANSLATIONS.map((entry) => entry.group ?? entry.label),
            ).size} languages · Tanzil.net and the pinned quranjson source`}
            onPress={() => router.push("/about")}
          />
          <InfoRow
            label="Tajweed"
            value={`${formatCount(SOURCE_INFO.counts.tajweedSegments)} source ranges · 147 verses shown plain where the source annotations do not align`}
          />
          <InfoRow
            label="Recitation"
            value={`${SOURCE_INFO.audio.reciter} · ${SOURCE_INFO.audio.source} · ${SOURCE_INFO.audio.bitrate ?? "streamed"}`}
          />
          <InfoRow
            label="Recitation catalogue"
            value={`${RECITERS.length} editions · everyayah.com · ${EXCLUDED_RECITERS.length} audited folders not offered`}
          />
          <InfoRow label="Bundled database" value={`${databaseMiB} MiB · schema 2`} />
          <InfoRow label="Arabic font" value="Amiri Quran · SIL Open Font License" />
          <InfoRow
            label="Accuracy, sources and reporting"
            value="How the text was checked and how to report a discrepancy"
            onPress={() => router.push("/about")}
          />
        </Card>

        <SectionHeader title="About" style={styles.section} />
        <Card padded={false} style={styles.infoCard}>
          <InfoRow label="Application" value="Mushafly for Android" />
          <InfoRow label="Version" value={version} />
          <InfoRow
            label="Report an issue"
            value={ISSUE_URL}
            onPress={() => void Linking.openURL(ISSUE_URL).catch(() => {})}
          />
          <InfoRow
            label="Contact"
            value={CONTACT}
            onPress={() => void Linking.openURL(`mailto:${CONTACT}`).catch(() => {})}
          />
        </Card>

        <TranslationPickerSheet
          visible={translationOpen}
          value={settings.translation}
          onClose={() => setTranslationOpen(false)}
          onChange={(translation) => update({ translation })}
        />

        <ReciterPickerSheet
          visible={reciterOpen}
          value={settings.reciter}
          onClose={() => setReciterOpen(false)}
          onChange={(reciter) => {
            if (reciter !== settings.reciter) update({ reciter });
          }}
        />

        <View style={styles.reset}>
          <Button
            label="Reset reading settings"
            variant="secondary"
            icon="refresh"
            onPress={() =>
              Alert.alert(
                "Reset reading settings?",
                "Theme, type sizes, translation, reciter and Tajweed return to their defaults. Bookmarks and your reading position are not deleted.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Reset", style: "destructive", onPress: reset },
                ],
              )
            }
          />
          <AppText variant="caption" tone="muted" style={styles.resetNote}>
            Bookmarks, reading position and settings live in a separate local
            database from the Quran text. Replacing the bundled Quran data does
            not erase them.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 42,
  },
  title: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 560,
  },
  section: {
    marginTop: 30,
    marginBottom: 10,
  },
  control: {
    marginTop: 8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  help: {
    marginTop: 10,
    lineHeight: 18,
  },
  audioNote: {
    lineHeight: 19,
  },
  infoCard: {
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    flex: 1.35,
    textAlign: "right",
  },
  errorCard: {
    marginTop: 20,
  },
  errorText: {
    marginTop: 6,
  },
  reset: {
    marginTop: 34,
    gap: 12,
  },
  resetNote: {
    lineHeight: 18,
  },
});
