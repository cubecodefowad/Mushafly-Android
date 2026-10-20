import { render, screen } from "@testing-library/react-native";
import { arabicLineHeight } from "../../src/theme/typography";
import { ArabicText } from "../../src/components/quran/ArabicText";
import { renderTajweed } from "../../src/features/quran/tajweed";
import { TAJWEED_RULES } from "../../src/features/quran/tajweed-rules";
import { TAJWEED_COLORS } from "../../src/theme/palette";

jest.mock("../../src/theme/ThemeProvider", () => ({
  useTheme: () => ({
    scheme: "light",
    isDark: false,
    colors: {
      paper: "#faf8f3",
      surface: "#ffffff",
      surfaceMuted: "#f3efe6",
      ink: "#252821",
      muted: "#666a61",
      accent: "#426b55",
      accentSoft: "#e6efe9",
      border: "#e2ddd2",
      highlight: "#eef2ec",
    },
    fonts: { arabic: "AmiriQuran", serif: "serif", sans: "sans-serif", sansMedium: "sans-serif-medium" },
    spacing: (n: number) => n * 4,
  }),
}));

const KEPT_TEXT =
  "وَلِلَّهِ يَسْجُدُ مَن فِى ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ طَوْعًا وَكَرْهًا وَظِلَٰلُهُم بِٱلْغُدُوِّ وَٱلْآصَالِ \u06E9";

function flatten(node: unknown): string {
  if (node == null || node === false) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flatten).join("");
  // `toJSON()` exposes children on the node itself; JSX elements keep them in props.
  const element = node as {
    children?: unknown;
    props?: { children?: unknown };
  };
  if (typeof element.children === "string") return element.children;
  if (Array.isArray(element.children)) return element.children.map(flatten).join("");
  return element.props ? flatten(element.props.children) : "";
}

describe("ArabicText", () => {
  it("scales the line box with the requested Arabic size", () => {
    expect(arabicLineHeight(22)).toBeGreaterThanOrEqual(22 * 2.449);
    expect(arabicLineHeight(52)).toBeGreaterThanOrEqual(52 * 2.449);
    expect(arabicLineHeight(34)).toBeGreaterThan(arabicLineHeight(33));
  });

  it("renders the exact source string when Tajweed is off", async () => {
    const view = await render(<ArabicText text={KEPT_TEXT} size={34} />);
    expect(flatten(view.toJSON())).toBe(KEPT_TEXT);
  });

  it("renders the exact source string when Tajweed segments are used", async () => {
    const rendered = renderTajweed(
      KEPT_TEXT,
      [{ start: 0, end: 8, rule: "hamzat_wasl" }],
      { knownRules: new Set(Object.keys(TAJWEED_RULES)) },
    );
    expect(rendered.status).toBe("ok");
    const view = await render(
      <ArabicText text={KEPT_TEXT} segments={rendered.segments} showTajweed size={34} />,
    );
    expect(flatten(view.toJSON())).toBe(KEPT_TEXT);
  });

  it("paints the source rule with its palette colour", async () => {
    const rendered = renderTajweed(
      KEPT_TEXT,
      [{ start: 0, end: 8, rule: "hamzat_wasl" }],
      { knownRules: new Set(Object.keys(TAJWEED_RULES)) },
    );
    const view = await render(
      <ArabicText text={KEPT_TEXT} segments={rendered.segments} showTajweed size={34} />,
    );
    const tree = JSON.stringify(view.toJSON());
    expect(tree).toContain(TAJWEED_COLORS.hamzat_wasl.light.toLowerCase());
    expect(tree).toContain("underline");
  });

  it("keeps the sajdah character at the end of the verse", async () => {
    await render(<ArabicText text={KEPT_TEXT} size={34} />);
    expect(screen.getByText(KEPT_TEXT)).toBeTruthy();
    expect(KEPT_TEXT.endsWith("\u06E9")).toBe(true);
  });

  it("asks for right-to-left text and Arabic accessibility language", async () => {
    await render(
      <ArabicText text={KEPT_TEXT} size={34} accessibilityLabel="Al-A'raf 206" />,
    );
    const node = screen.getByLabelText("Al-A'raf 206");
    const style = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;
    expect(node.props.accessibilityLanguage).toBe("ar");
    expect(style.writingDirection).toBe("rtl");
    expect(style.textAlign).toBe("right");
    expect(style.fontFamily).toBe("AmiriQuran");
  });

  it("reserves the font's whole line box so marks and tails stay visible", async () => {
    await render(
      <ArabicText text={KEPT_TEXT} size={34} accessibilityLabel="Al-A'raf 206" />,
    );
    const node = screen.getByLabelText("Al-A'raf 206");
    const style = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;
    // Amiri Quran's ascent (1.815 em) plus descent (0.634 em) is 2.449 em.
    // Android rewrites the font metrics to the requested line height, so a
    // shorter box clips the pause signs above and the tails below.
    expect(style.lineHeight).toBeGreaterThanOrEqual(34 * 2.449);
  });
});
