import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";

export function Pill({
  children,
  tone = "accent",
  icon,
}: {
  children: ReactNode;
  tone?: "accent" | "muted" | "danger";
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  const color =
    tone === "accent" ? colors.accent : tone === "danger" ? colors.danger : colors.muted;
  const background =
    tone === "accent"
      ? colors.accentSoft
      : tone === "danger"
        ? colors.dangerSoft
        : colors.surfaceMuted;
  return (
    <View style={[styles.pill, { backgroundColor: background, borderColor: color }]}>
      {icon}
      <AppText variant="label" style={{ color }} maxFontSizeMultiplier={1.4}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
