// @ts-check
const path = require("path");

const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const baseConfig = getDefaultConfig(path.resolve());
const resolver = baseConfig.resolver ?? { assetExts: [], sourceExts: [] };
const assetExts = resolver.assetExts ? [...resolver.assetExts] : [];
const sourceExts = resolver.sourceExts ? [...resolver.sourceExts] : [];

if (!assetExts.includes("wasm")) {
    assetExts.push("wasm");
}

module.exports = mergeConfig(baseConfig, {
    resolver: {
        assetExts,
        sourceExts: sourceExts.filter((ext) => ext !== "wasm"),
        unstable_enablePackageExports: false,
    },
});
