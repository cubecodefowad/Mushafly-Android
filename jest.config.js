module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "/dist/"],
  collectCoverageFrom: [
    "src/features/**/*.ts",
    "src/database/**/*.ts",
    "src/components/**/*.tsx",
    "!src/**/*.d.ts",
  ],
};
