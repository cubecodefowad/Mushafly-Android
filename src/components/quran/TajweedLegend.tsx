import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { tajweedColor } from "../../theme/palette";
import { TAJWEED_RULES } from "../../features/quran/tajweed-rules";
import { AppText } from "../ui/AppText";

export function TajweedLegend({
  rules,
  unavailableCount,
}: {
  rules: string[];
  unavailableCount: number;
}) {
  const { colors, scheme } = useTheme();
  if (rules.length === 0 && unavailableCount === 0) return null;

  return (
    <View style={styles.wrap}>
      {unavailableCount > 0 ? (
        <AppText variant="caption" tone="muted" style={styles.note}>
          {unavailableCount} verse{unavailableCount === 1 ? " is" : "s are"} shown as
          plain source text because the supplied Tajweed annotations do not align
          with the displayed characters. No text is changed.
        </AppText>
      ) : null}
      {rules.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ruleRow}
          accessibilityLabel="Tajweed colour key"
        >
          {rules.map((rule) => {
            const info = TAJWEED_RULES[rule];
            const color = tajweedColor(rule, scheme) ?? colors.muted;
            return (
              <View
                key={rule}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                accessible
                accessibilityLabel={`Tajweed rule: ${info?.label ?? rule}`}
              >
                <View style={[styles.dot, { backgroundColor: color }]} />
                <AppText variant="caption" numberOfLines={1} maxFontSizeMultiplier={1.25}>
                  {info?.label ?? rule}
                </AppText>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  ruleRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  note: {
    marginBottom: 10,
    lineHeight: 17,
  },
});
