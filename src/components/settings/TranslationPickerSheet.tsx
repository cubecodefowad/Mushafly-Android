import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { arabicLineHeight } from "../../theme/typography";
import {
  groupedTranslations,
  translationInfo,
  translationLabel,
} from "../../features/settings/settings";
import type { TranslationLanguage } from "../../types/quran";
import { AppText } from "../ui/AppText";
import { BottomSheet } from "../ui/BottomSheet";
import { Icon } from "../ui/Icon";

export function TranslationPickerSheet({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: TranslationLanguage;
  onClose: () => void;
  onChange: (value: TranslationLanguage) => void;
}) {
  const { colors, fonts } = useTheme();
  const [query, setQuery] = useState("");
  const active = translationInfo(value);

  const groups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const grouped = groupedTranslations();
    if (!needle) return grouped;
    return grouped
      .map((group) => ({
        label: group.label,
        translations: group.translations.filter((translation) =>
          `${group.label} ${translationLabel(translation)} ${translation.translator} ${translation.name}`
            .toLocaleLowerCase()
            .includes(needle),
        ),
      }))
      .filter((group) => group.translations.length > 0);
  }, [query]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Translation">
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
      >
        <Icon name="search-outline" size={17} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Language, translator or edition"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.ink }]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search translations"
        />
        {query ? (
          <Pressable
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Clear translation search"
            hitSlop={8}
          >
            <Icon name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.current}>
        <AppText variant="caption" tone="muted">
          Reading with{" "}
          <AppText variant="label" style={{ color: colors.accent }}>
            {translationLabel(active)}
          </AppText>
          {" · "}
          {active.translator}
        </AppText>
      </View>

      {groups.length === 0 ? (
        <AppText variant="caption" tone="muted" style={styles.empty}>
          No bundled dataset matches “{query.trim()}”.
        </AppText>
      ) : null}

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <AppText variant="meta" tone="muted" style={styles.groupLabel}>
            {group.label}
          </AppText>
          {group.translations.map((translation) => {
            const selected = translation.languageCode === value;
            const rtl = translation.direction === "rtl";
            return (
              <Pressable
                key={translation.languageCode}
                onPress={() => {
                  onChange(translation.languageCode);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${translationLabel(translation)}, ${translation.translator}`}
                android_ripple={{ color: colors.highlight }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected
                      ? colors.accentSoft
                      : pressed
                        ? colors.surfaceMuted
                        : "transparent",
                  },
                ]}
              >
                <View style={styles.optionCopy}>
                  <AppText
                    variant="label"
                    style={[
                      styles.optionName,
                      rtl
                        ? {
                            fontFamily: fonts.arabic,
                            fontSize: 19,
                            lineHeight: arabicLineHeight(19),
                          }
                        : null,
                    ]}
                  >
                    {translationLabel(translation)}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={2}>
                    {translation.name} · {translation.translator} · {translation.source}
                  </AppText>
                </View>
                {selected ? (
                  <Icon name="checkmark-circle" size={20} color={colors.accent} />
                ) : (
                  <View
                    style={[styles.dot, { borderColor: colors.border }]}
                    accessibilityElementsHidden
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <AppText variant="caption" tone="muted" style={styles.footnote}>
        {`${groups.reduce((sum, group) => sum + group.translations.length, 0)} datasets bundled for offline reading — every edition the website publishes. Only the selected one is unpacked on this device.`}
      </AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    paddingVertical: 0,
  },
  current: {
    marginTop: 10,
  },
  group: {
    marginTop: 18,
  },
  groupLabel: {
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionName: {
    fontSize: 15,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    marginTop: 16,
  },
  footnote: {
    marginTop: 18,
    lineHeight: 18,
  },
});
