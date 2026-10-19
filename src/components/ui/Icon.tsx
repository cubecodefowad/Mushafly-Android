import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  /** React Navigation passes a `ColorValue`, so accept that wider type. */
  color?: ColorValue;
}) {
  // Ionicons rejects a `null` colour, which is part of `ColorValue`.
  return <Ionicons name={name} size={size} color={typeof color === "string" ? color : undefined} />;
}
