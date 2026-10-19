import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";
import { BrandMark } from "./BrandMark";
import { Screen } from "./Screen";

export function BootScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <View style={styles.wrap}>
        <BrandMark size={58} />
        <AppText variant="display" style={styles.brand}>
          Mushafly
        </AppText>
        <AppText tone="muted" style={styles.subtitle}>
          Preparing the Mushaf…
        </AppText>
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
        <AppText variant="caption" tone="muted" style={styles.note}>
          The complete Quran text is bundled with the app. After this first
          preparation, reading works without internet.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  brand: {
    marginTop: 16,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 8,
  },
  spinner: {
    marginTop: 28,
  },
  note: {
    marginTop: 24,
    maxWidth: 300,
    textAlign: "center",
  },
});
