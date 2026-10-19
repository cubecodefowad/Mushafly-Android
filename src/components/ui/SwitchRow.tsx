import { StyleSheet, Switch, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 56,
    paddingVertical: 4,
  },
  copy: {
    flex: 1,
  },
  description: {
    marginTop: 3,
  },
});
