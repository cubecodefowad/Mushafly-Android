/**
 * Jest setup shared by every suite.
 *
 * The component tests render presentational pieces only; native modules that
 * need a device (SQLite, audio, navigation bar) are not mounted. `jest-expo`
 * already supplies their JS shims, so this file only removes the noisy
 * "act" warning from animated splash screens that are not part of any test.
 */
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  useFonts: () => [true, null],
  isLoaded: () => true,
}));

jest.setTimeout(30_000);
