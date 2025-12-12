if (typeof globalThis.__ExpoImportMetaRegistry !== "function") {
    globalThis.__ExpoImportMetaRegistry = () => ({});
}

// Ensure env module resolution does not break tests
jest.mock("react-native-dotenv", () => ({
    EXPO_PUBLIC_OPENAI_PROXY_URL: "",
    EXPO_PUBLIC_OPENAI_PROXY_KEY: "",
}));
