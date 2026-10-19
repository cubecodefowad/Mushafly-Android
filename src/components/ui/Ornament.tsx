import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

export function Ornament({ width = 92 }: { width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.line, { width, backgroundColor: colors.border }]} />
      <View style={[styles.diamond, { borderColor: colors.accent }]} />
      <View style={[styles.line, { width, backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  line: {
    height: StyleSheet.hairlineWidth,
  },
  diamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    transform: [{ rotate: "45deg" }],
  },
});
