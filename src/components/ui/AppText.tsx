import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyMedium"
  | "label"
  | "caption"
  | "meta";

export type TextTone = "ink" | "muted" | "accent" | "danger" | "onAccent";

type Props = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
};

export function AppText({
  variant = "body",
  tone = "ink",
  style,
  children,
  ...rest
}: Props) {
  const { colors, fonts } = useTheme();
  const color =
    tone === "muted"
      ? colors.muted
      : tone === "accent"
        ? colors.accent
        : tone === "danger"
          ? colors.danger
          : tone === "onAccent"
            ? colors.paper
            : colors.ink;

  return (
    <Text
      {...rest}
      style={[styles[variant], { color, fontFamily: fontFor(variant, fonts) }, style]}
    >
      {children}
    </Text>
  );
}

function fontFor(
  variant: TextVariant,
  fonts: { serif: string; sans: string; sansMedium: string },
): string {
  if (variant === "display" || variant === "title") return fonts.serif;
  if (variant === "heading" || variant === "label" || variant === "meta") {
    return fonts.sansMedium;
  }
  return fonts.sans;
}

const styles = StyleSheet.create({
  display: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  meta: {
    fontSize: 10.5,
    lineHeight: 15,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
