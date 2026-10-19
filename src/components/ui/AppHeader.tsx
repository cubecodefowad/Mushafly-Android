import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";
import { IconButton } from "./IconButton";

export function AppHeader({
  title,
  right,
  onBack,
  bordered = true,
  subtitle,
}: {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
  bordered?: boolean;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: bordered ? colors.border : "transparent" },
      ]}
    >
      <IconButton
        icon="chevron-back"
        label="Go back"
        onPress={
          onBack ??
          (() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          })
        }
      />
      <View style={styles.titleWrap}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  right: {
    minWidth: 44,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
