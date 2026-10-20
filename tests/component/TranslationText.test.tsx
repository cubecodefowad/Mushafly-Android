import { render, screen } from "@testing-library/react-native";
import { TranslationText } from "../../src/components/quran/TranslationText";

jest.mock("../../src/theme/ThemeProvider", () => ({
  useTheme: () => ({
    scheme: "light",
    isDark: false,
    colors: {
      paper: "#faf8f3",
      ink: "#252821",
      muted: "#666a61",
      accent: "#426b55",
      border: "#e2ddd2",
    },
    fonts: {
      arabic: "AmiriQuran",
      serif: "serif",
      sans: "sans-serif",
      sansMedium: "sans-serif-medium",
    },
    spacing: (n: number) => n * 4,
  }),
}));

function styleOf(node: { props: { style?: unknown } }) {
  return Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style.filter(Boolean))
    : (node.props.style as Record<string, unknown>);
}

describe("TranslationText", () => {
  it("leaves the line box to the platform so RTL tails are not clipped", async () => {
    const text = "جو لوگ ایمان لائے اور نیک عمل کیے";
    await render(<TranslationText text={text} size={17} rtl />);
    const style = styleOf(screen.getByText(text));
    // An explicit lineHeight makes Android shrink the font metrics to fit it,
    // cutting the descenders of Urdu, Persian and Bengali letters in half.
    expect(style.lineHeight).toBeUndefined();
    expect(style.writingDirection).toBe("rtl");
    expect(style.textAlign).toBe("right");
    // The bundled Amiri Quran face has no Urdu glyphs, so the device font is used.
    expect(style.fontFamily).toBeUndefined();
  });

  it("leaves the line box to the platform for Latin translations too", async () => {
    const text = "Those who believe and do righteous deeds";
    await render(<TranslationText text={text} size={17} rtl={false} />);
    const style = styleOf(screen.getByText(text));
    expect(style.lineHeight).toBeUndefined();
    expect(style.writingDirection).toBe("ltr");
    expect(style.fontFamily).toBe("serif");
  });

  it("centres the Bismillah translation without a fixed line height", async () => {
    const text = "In the name of Allah, the Entirely Merciful";
    await render(<TranslationText text={text} size={16} rtl={false} center />);
    const style = styleOf(screen.getByText(text));
    expect(style.textAlign).toBe("center");
    expect(style.lineHeight).toBeUndefined();
  });
});
