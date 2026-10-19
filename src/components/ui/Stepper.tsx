import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

export function Stepper({
  label,
  description,
  value,
  displayValue,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: {
  label: string;
  description?: string;
  value: number;
  displayValue?: string;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText variant="bodyMedium">{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted" style={styles.description}>
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.controls, { borderColor: colors.border }]}>
        <Pressable
          onPress={onDecrease}
          disabled={!canDecrease}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          accessibilityState={{ disabled: !canDecrease }}
          hitSlop={4}
          style={({ pressed }) => [
            styles.button,
            { opacity: canDecrease ? (pressed ? 0.55 : 1) : 0.3 },
          ]}
        >
          <Icon name="remove" size={17} color={colors.ink} />
        </Pressable>
        <AppText
          variant="label"
          style={[styles.value, { color: colors.ink }]}
          accessibilityLabel={`${label}: ${displayValue ?? String(value)}`}
        >
          {displayValue ?? String(value)}
        </AppText>
        <Pressable
          onPress={onIncrease}
          disabled={!canIncrease}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          accessibilityState={{ disabled: !canIncrease }}
          hitSlop={4}
          style={({ pressed }) => [
            styles.button,
            { opacity: canIncrease ? (pressed ? 0.55 : 1) : 0.3 },
          ]}
        >
          <Icon name="add" size={17} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  copy: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: "hidden",
  },
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 38,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
