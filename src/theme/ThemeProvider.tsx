import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Platform, useColorScheme } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { useSettings } from "../features/settings/SettingsProvider";
import {
  DARK_COLORS,
  LIGHT_COLORS,
  type ColorScheme,
  type ThemeColors,
} from "./palette";

export type ThemeValue = {
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  /** Android and iOS system font families selected for the editorial layout. */
  fonts: {
    arabic: string;
    serif: string;
    sans: string;
    sansMedium: string;
  };
  spacing: (value: number) => number;
};

const FONTS = {
  arabic: "AmiriQuran",
  serif: Platform.select({ android: "serif", ios: "Georgia", default: "Georgia" })!,
  sans: Platform.select({ android: "sans-serif", ios: "System", default: "System" })!,
  sansMedium: Platform.select({
    android: "sans-serif-medium",
    ios: "System",
    default: "System",
  })!,
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { settings } = useSettings();
  const scheme: ColorScheme =
    settings.theme === "system" ? (system === "dark" ? "dark" : "light") : settings.theme;
  const colors = scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    // Edge-to-edge Android ignores the bar colour, but the button style still
    // needs to contrast with the paper background.
    NavigationBar.setStyle(scheme === "dark" ? "dark" : "light");
    SystemUI.setBackgroundColorAsync(colors.paper).catch(() => {});
  }, [scheme, colors.paper]);

  const value = useMemo<ThemeValue>(
    () => ({
      scheme,
      colors,
      isDark: scheme === "dark",
      fonts: FONTS,
      spacing: (multiple: number) => multiple * 4,
    }),
    [scheme, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
