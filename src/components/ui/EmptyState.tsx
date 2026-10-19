import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
        <Icon name={icon} size={24} color={colors.accent} />
      </View>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <AppText tone="muted" style={styles.body}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 18,
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    textAlign: "center",
    maxWidth: 320,
  },
  action: {
    marginTop: 20,
  },
});
