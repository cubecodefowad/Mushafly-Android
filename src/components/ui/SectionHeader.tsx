import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <AppText variant="heading">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
        >
          <AppText variant="label" style={{ color: colors.accent }}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  action: {
    minHeight: 32,
    justifyContent: "center",
  },
});
