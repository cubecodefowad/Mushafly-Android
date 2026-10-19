import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";
import { Card } from "./Card";
import { Screen } from "./Screen";

export function ErrorScreen({
  title = "The Quran data could not be opened",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandMark size={54} />
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        <AppText tone="muted" style={styles.message}>
          Reading cannot start until the bundled data is available. Nothing is
          hidden or replaced; the app stops rather than showing an incomplete
          Mushaf.
        </AppText>
        <Card style={styles.detail}>
          <AppText variant="meta" tone="muted">
            Details
          </AppText>
          <AppText variant="caption" style={styles.detailText} selectable>
            {message}
          </AppText>
        </Card>
        {onRetry ? (
          <View style={styles.action}>
            <Button label="Try again" onPress={onRetry} icon="refresh" />
          </View>
        ) : null}
        <AppText variant="caption" tone="muted" style={styles.note}>
          Bookmarks, reading position and preferences live in a separate local
          database, so this error does not erase them.
        </AppText>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <AppText variant="caption" tone="muted" style={styles.note}>
          If this keeps happening, reinstall the app or report it at
          hello@mushafly.com with the message above.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    marginTop: 20,
  },
  message: {
    marginTop: 10,
    maxWidth: 420,
  },
  detail: {
    marginTop: 22,
  },
  detailText: {
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  action: {
    marginTop: 22,
    alignSelf: "flex-start",
  },
  note: {
    marginTop: 18,
    maxWidth: 420,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginTop: 26,
  },
});
