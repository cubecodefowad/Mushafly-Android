import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "quiet";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  compact = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const background =
    variant === "primary"
      ? colors.accent
      : variant === "secondary"
        ? colors.surface
        : "transparent";
  const foreground =
    variant === "primary" ? colors.paper : variant === "secondary" ? colors.ink : colors.accent;
  const border = variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      android_ripple={{
        color: variant === "primary" ? "rgba(255,255,255,0.16)" : colors.highlight,
      }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: background,
          borderColor: border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={17} color={foreground} /> : null}
        <AppText
          variant="label"
          style={{ color: foreground }}
          numberOfLines={1}
          maxFontSizeMultiplier={1.5}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
