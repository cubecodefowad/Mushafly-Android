import { Pressable, StyleSheet, View } from "react-native";
import { useSettings } from "../../features/settings/SettingsProvider";
import {
  SETTINGS_LIMITS,
  adjustSize,
  translationInfo,
  translationLabel,
} from "../../features/settings/settings";
import { reciterInfo } from "../../features/audio/reciters";
import type { ThemePreference } from "../../types/quran";
import { useTheme } from "../../theme/ThemeProvider";
import { BottomSheet } from "../ui/BottomSheet";
import { AppText } from "../ui/AppText";
import { Segmented } from "../ui/Segmented";
import { Stepper } from "../ui/Stepper";
import { SwitchRow } from "../ui/SwitchRow";
import { Icon } from "../ui/Icon";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ReaderAppearanceSheet({
  visible,
  onClose,
  onOpenTranslation,
  onOpenReciter,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenTranslation: () => void;
  onOpenReciter: () => void;
}) {
  const { settings, update } = useSettings();
  const { colors } = useTheme();
  const dataset = translationInfo(settings.translation);
  const reciter = reciterInfo(settings.reciter);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Reading appearance">
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
        label="Arabic text"
        description="Applies to the Quranic text only"
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
        label="Translation"
        description="Independent from the Arabic size"
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
        description="Hide it for a quieter Arabic-only page"
        value={settings.showTranslation}
        onValueChange={(showTranslation) => update({ showTranslation })}
      />
      <SwitchRow
        label="Tajweed highlighting"
        description="Colours come from the source annotations; the text is unchanged"
        value={settings.tajweed}
        onValueChange={(tajweed) => update({ tajweed })}
      />

      <AppText variant="meta" tone="muted" style={styles.topGap}>
        Translation
      </AppText>
      <Pressable
        onPress={onOpenTranslation}
        accessibilityRole="button"
        accessibilityLabel={`Change translation. Currently ${translationLabel(dataset)}`}
        style={({ pressed }) => [
          styles.pickerRow,
          {
            borderColor: colors.border,
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          },
        ]}
      >
        <View style={styles.pickerCopy}>
          <AppText variant="label">{translationLabel(dataset)}</AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {dataset.language ?? dataset.label} · {dataset.translator}
          </AppText>
        </View>
        <Icon name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>
      <AppText variant="caption" tone="muted" style={styles.footnote}>
        Changes are saved automatically. Arabic datasets are commentaries (tafsir),
        not verse translations.
      </AppText>

      <AppText variant="meta" tone="muted" style={styles.topGap}>
        Recitation
      </AppText>
      <Pressable
        onPress={onOpenReciter}
        accessibilityRole="button"
        accessibilityLabel={`Change reciter. Currently ${reciter.name}`}
        style={({ pressed }) => [
          styles.pickerRow,
          {
            borderColor: colors.border,
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          },
        ]}
      >
        <View style={styles.pickerCopy}>
          <AppText variant="label">{reciter.name}</AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {reciter.bitrate ? `${reciter.bitrate} · ` : ""}
            {reciter.source}
          </AppText>
        </View>
        <Icon name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>
      <AppText variant="caption" tone="muted" style={styles.footnote}>
        Recitation is streamed one ayah at a time. Changing it stops playback so
        the next verse starts from the source you chose.
      </AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  control: {
    marginTop: 8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  topGap: {
    marginTop: 8,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 8,
  },
  pickerCopy: {
    flex: 1,
  },
  footnote: {
    marginTop: 14,
  },
});
