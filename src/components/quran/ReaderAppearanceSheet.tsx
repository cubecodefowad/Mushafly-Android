import { View, StyleSheet } from "react-native";
import { useSettings } from "../../features/settings/SettingsProvider";
import {
  SETTINGS_LIMITS,
  TRANSLATIONS,
  adjustSize,
} from "../../features/settings/settings";
import type { ThemePreference, TranslationLanguage } from "../../types/quran";
import { useTheme } from "../../theme/ThemeProvider";
import { BottomSheet } from "../ui/BottomSheet";
import { AppText } from "../ui/AppText";
import { Segmented } from "../ui/Segmented";
import { Stepper } from "../ui/Stepper";
import { SwitchRow } from "../ui/SwitchRow";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ReaderAppearanceSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { settings, update } = useSettings();
  const { colors } = useTheme();

  const translationOptions = TRANSLATIONS.map((entry) => ({
    value: entry.languageCode as TranslationLanguage,
    label: entry.label,
  }));

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
      <Segmented
        options={translationOptions}
        value={settings.translation}
        onChange={(translation) => update({ translation })}
        style={styles.control}
      />
      <AppText variant="caption" tone="muted" style={styles.footnote}>
        Changes are saved automatically. Arabic commentary is Tafsir al-Muyassar
        from the pinned source, not a verse translation.
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
  footnote: {
    marginTop: 14,
  },
});
