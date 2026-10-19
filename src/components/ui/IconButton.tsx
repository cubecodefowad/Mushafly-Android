import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Icon, type IconName } from "./Icon";

export function IconButton({
  icon,
  label,
  onPress,
  active = false,
  disabled = false,
  size = 20,
  color,
  style,
  hitSlop = 6,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
}) {
  const { colors } = useTheme();
  const tint = disabled ? colors.border : active ? colors.accent : (color ?? colors.muted);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      android_ripple={{ color: colors.highlight, borderless: true, radius: 22 }}
      style={({ pressed }) => [
        styles.button,
        active && { backgroundColor: colors.accentSoft },
        pressed && !disabled && { backgroundColor: colors.highlight },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={size} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.55,
  },
});
