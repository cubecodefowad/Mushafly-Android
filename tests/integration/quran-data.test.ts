/**
 * @jest-environment node
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

/**
 * The shipped database is validated by a script rather than by reading rows in
 * Jest, so the same checks that gate a release also gate `npm test`. The script
 * verifies the pinned SHA-256, all 6,236 numbered verses, sajdah references,
 * Tajweed alignment, audio URLs and font glyph coverage.
 */
describe("bundled Quran database", () => {
  it("passes the release validation script", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=ExperimentalWarning",
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        path.join(root, "scripts/validate-quran-db.mjs"),
      ],
      { cwd: root, encoding: "utf8", timeout: 120_000 },
    );

    expect(output).toContain("Quran data validation passed.");
    expect(output).toContain("114 surahs, 6,236 numbered verses");
    expect(output).toContain("15 references, source character present");
    expect(output).toContain("font");
  });
});
