// The Quran database is a read-only bundled asset. Metro does not treat `.db`
// as an asset by default, so add it explicitly; the runtime copies it out of
// the app bundle with expo-asset.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes("db")) {
  config.resolver.assetExts.push("db");
}

module.exports = config;
