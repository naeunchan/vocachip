module.exports = function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-granite"],
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
        ],
    };
};
