import { render, screen } from "@testing-library/react-native";
import { SajdahBadge } from "../../src/components/quran/SajdahBadge";

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

describe("SajdahBadge", () => {
  it("shows the source sign together with a readable label", async () => {
    await render(<SajdahBadge />);
    expect(screen.getByText("\u06E9")).toBeTruthy();
    expect(screen.getByText("Sajdah")).toBeTruthy();
  });

  it("exposes a descriptive accessibility label", async () => {
    await render(<SajdahBadge />);
    expect(screen.getByLabelText("Verse of prostration, sajdah")).toBeTruthy();
  });
});
