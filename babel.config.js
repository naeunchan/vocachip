module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            [
                "babel-preset-expo",
                {
                    unstable_transformImportMeta: true,
                },
            ],
        ],
        plugins: [
            [
                "module-resolver",
                {
                    root: ["./"],
                    alias: {
                        "@": "./src",
                    },
                },
            ],
            [
                "module:react-native-dotenv",
                {
                    moduleName: "@env",
                    path: ".env",
                    allowUndefined: true,
                },
            ],
        ],
    };
};
