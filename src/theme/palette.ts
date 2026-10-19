export type ColorScheme = "light" | "dark";

export type ThemeColors = {
  paper: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  muted: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  border: string;
  highlight: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  shadow: string;
};

export const LIGHT_COLORS: ThemeColors = {
  paper: "#faf8f3",
  surface: "#ffffff",
  surfaceMuted: "#f3efe6",
  ink: "#252821",
  muted: "#666a61",
  accent: "#426b55",
  accentStrong: "#2f5440",
  accentSoft: "#e8efe7",
  border: "#e7e3da",
  highlight: "#eee7d8",
  danger: "#a32e3c",
  dangerSoft: "#f6e7e8",
  overlay: "rgba(27, 30, 25, 0.38)",
  shadow: "rgba(37, 40, 33, 0.12)",
};

export const DARK_COLORS: ThemeColors = {
  paper: "#171916",
  surface: "#20231f",
  surfaceMuted: "#1c1f1b",
  ink: "#f1eee6",
  muted: "#b1b4aa",
  accent: "#a4c5a9",
  accentStrong: "#c4dec7",
  accentSoft: "#2a332c",
  border: "#383c35",
  highlight: "#2a2e28",
  danger: "#f093ac",
  dangerSoft: "#3a2529",
  overlay: "rgba(0, 0, 0, 0.58)",
  shadow: "rgba(0, 0, 0, 0.35)",
};

/** The 18 source-derived Tajweed identifiers, in the web app's palette. */
export const TAJWEED_COLORS: Record<string, { light: string; dark: string }> = {
  hamzat_wasl: { light: "#7b4fa0", dark: "#c9a7f0" },
  madd_2: { light: "#1e5fa8", dark: "#8fb8ec" },
  madd_246: { light: "#176f73", dark: "#79c9cc" },
  madd_6: { light: "#a32e3c", dark: "#f08a96" },
  madd_munfasil: { light: "#2e6b3e", dark: "#8fcb9a" },
  madd_muttasil: { light: "#7a4a1e", dark: "#d6a66f" },
  ikhfa: { light: "#a14a22", dark: "#e8a47d" },
  ikhfa_shafawi: { light: "#7a5b12", dark: "#d9c06e" },
  ghunnah: { light: "#8b3a62", dark: "#e69ab8" },
  idghaam_ghunnah: { light: "#4a6b1a", dark: "#b5ce7a" },
  idghaam_no_ghunnah: { light: "#3d6b52", dark: "#8fc7a8" },
  idghaam_shafawi: { light: "#3b5f82", dark: "#9fbedc" },
  idghaam_mutajanisayn: { light: "#66508c", dark: "#c3afe3" },
  idghaam_mutaqaribayn: { light: "#8a4f6b", dark: "#dfa2bf" },
  iqlab: { light: "#a63a5b", dark: "#f093ac" },
  qalqalah: { light: "#a3402e", dark: "#f09884" },
  lam_shamsiyyah: { light: "#615846", dark: "#c0b49a" },
  silent: { light: "#6b6e66", dark: "#a9aca3" },
};

export function tajweedColor(rule: string | undefined, scheme: ColorScheme): string | undefined {
  if (!rule) return undefined;
  return TAJWEED_COLORS[rule]?.[scheme];
}
