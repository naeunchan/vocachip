const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    config.experiments = {
        ...(config.experiments || {}),
        asyncWebAssembly: true,
    };

    config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
    });

    return config;
};
