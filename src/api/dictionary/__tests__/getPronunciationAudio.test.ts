type OpenAIConfigMock = {
    featureEnabled: boolean;
    proxyUrl: string;
    proxyKey: string;
};

const originalFetch = global.fetch;
const preferenceStore: Record<string, string> = {};

function loadModule(config: OpenAIConfigMock) {
    let loaded: typeof import("@/api/dictionary/getPronunciationAudio");

    jest.resetModules();
    jest.isolateModules(() => {
        jest.doMock("@/config/openAI", () => ({
            getOpenAIConfig: () => ({
                proxyUrl: config.proxyUrl,
                proxyKey: config.proxyKey,
                healthUrl: config.proxyUrl ? `${config.proxyUrl.replace(/\/+$/, "")}/health` : "",
                featureEnabled: config.featureEnabled,
            }),
        }));
        jest.doMock("@/services/database", () => ({
            getPreferenceValue: jest.fn(async (key: string) =>
                Object.prototype.hasOwnProperty.call(preferenceStore, key) ? preferenceStore[key] : null,
            ),
            setPreferenceValue: jest.fn(async (key: string, value: string) => {
                preferenceStore[key] = value;
            }),
        }));
        loaded =
            require("@/api/dictionary/getPronunciationAudio") as typeof import("@/api/dictionary/getPronunciationAudio");
    });

    return loaded!;
}

function mockFetch(impl: jest.Mock) {
    (global as unknown as { fetch: typeof fetch }).fetch = impl as unknown as typeof fetch;
}

describe("getPronunciationAudio", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        Object.keys(preferenceStore).forEach((key) => {
            delete preferenceStore[key];
        });
        (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    });

    it("throws unavailable when proxy configuration is missing", async () => {
        const module = loadModule({
            featureEnabled: false,
            proxyUrl: "",
            proxyKey: "",
        });

        await expect(module.getPronunciationAudio("apple")).rejects.toMatchObject({
            code: "AI_TTS_UNAVAILABLE",
            retryable: false,
        });
    });

    it("prefers direct audio URLs", async () => {
        const module = loadModule({
            featureEnabled: true,
            proxyUrl: "https://example.com/",
            proxyKey: "secret",
        });
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                audioBase64: null,
                audioUrl: "https://example.com/dictionary/tts/abc123",
            }),
        });
        mockFetch(fetchMock);

        const uri = await module.getPronunciationAudio("apple");

        expect(uri).toBe("https://example.com/dictionary/tts/abc123");
    });

    it("falls back to an in-memory data URI when only base64 data is returned", async () => {
        const module = loadModule({
            featureEnabled: true,
            proxyUrl: "https://example.com",
            proxyKey: "secret",
        });
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                audioBase64: "YWJj",
                audioUrl: null,
            }),
        });
        mockFetch(fetchMock);

        const uri = await module.getPronunciationAudio("apple");

        expect(uri).toBe("data:audio/mp3;base64,YWJj");
    });

    it("reuses a persisted audio URL after the module reloads", async () => {
        const firstModule = loadModule({
            featureEnabled: true,
            proxyUrl: "https://example.com/",
            proxyKey: "secret",
        });
        const firstFetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                audioBase64: null,
                audioUrl: "https://example.com/dictionary/tts/abc123",
            }),
        });
        mockFetch(firstFetchMock);

        await expect(firstModule.getPronunciationAudio("apple")).resolves.toBe(
            "https://example.com/dictionary/tts/abc123",
        );
        expect(firstFetchMock).toHaveBeenCalledTimes(1);

        const secondModule = loadModule({
            featureEnabled: true,
            proxyUrl: "https://example.com/",
            proxyKey: "secret",
        });
        const secondFetchMock = jest.fn();
        mockFetch(secondFetchMock);

        await expect(secondModule.getPronunciationAudio("apple")).resolves.toBe(
            "https://example.com/dictionary/tts/abc123",
        );
        expect(secondFetchMock).not.toHaveBeenCalled();
    });
});
