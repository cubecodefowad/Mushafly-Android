import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "./AppText";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        style,
      ]}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            android_ripple={{ color: colors.highlight }}
            style={({ pressed }) => [
              styles.option,
              selected && {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && !selected && { opacity: 0.7 },
            ]}
          >
            <AppText
              variant="label"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              maxFontSizeMultiplier={1.3}
              style={{ color: selected ? colors.accent : colors.muted }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  option: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});
