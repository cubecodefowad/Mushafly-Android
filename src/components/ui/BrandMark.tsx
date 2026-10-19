import { Image } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

const LIGHT = require("../../../assets/images/mark-light.png");
const DARK = require("../../../assets/images/mark-dark.png");

export function BrandMark({ size = 40 }: { size?: number }) {
  const { isDark } = useTheme();
  return (
    <Image
      source={isDark ? DARK : LIGHT}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}
