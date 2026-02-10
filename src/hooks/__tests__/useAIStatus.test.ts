type OpenAIConfigMock = {
    OPENAI_FEATURE_ENABLED: boolean;
    AI_HEALTH_URL: string;
};

const originalFetch = global.fetch;

function loadModule(config: OpenAIConfigMock) {
    let loaded: typeof import("@/hooks/useAIStatus");

    jest.resetModules();
    jest.isolateModules(() => {
        jest.doMock("@/config/openAI", () => config);
        loaded = require("@/hooks/useAIStatus") as typeof import("@/hooks/useAIStatus");
    });

    return loaded!;
}

function mockFetch(impl: jest.Mock) {
    (global as unknown as { fetch: typeof fetch }).fetch = impl as unknown as typeof fetch;
}

describe("useAIStatus helpers", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    });

    it("returns unavailable when proxy settings are missing", async () => {
        const module = loadModule({ OPENAI_FEATURE_ENABLED: false, AI_HEALTH_URL: "" });
        const fetchMock = jest.fn();
        mockFetch(fetchMock);

        expect(module.getInitialAIStatus()).toBe("unavailable");
        await expect(module.fetchHealth()).resolves.toBe("unavailable");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns healthy when health endpoint responds with ok status", async () => {
        const module = loadModule({
            OPENAI_FEATURE_ENABLED: true,
            AI_HEALTH_URL: "https://example.com/health",
        });
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: "ok" }),
        });
        mockFetch(fetchMock);

        await expect(module.fetchHealth()).resolves.toBe("healthy");
    });

    it("returns degraded when health endpoint responds with non-ok", async () => {
        const module = loadModule({
            OPENAI_FEATURE_ENABLED: true,
            AI_HEALTH_URL: "https://example.com/health",
        });
        const fetchMock = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ status: "error" }),
        });
        mockFetch(fetchMock);

        await expect(module.fetchHealth()).resolves.toBe("degraded");
    });

    it("returns degraded when health payload is not healthy", async () => {
        const module = loadModule({
            OPENAI_FEATURE_ENABLED: true,
            AI_HEALTH_URL: "https://example.com/health",
        });
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: "unconfigured" }),
        });
        mockFetch(fetchMock);

        await expect(module.fetchHealth()).resolves.toBe("degraded");
    });

    it("returns degraded when health request fails", async () => {
        const module = loadModule({
            OPENAI_FEATURE_ENABLED: true,
            AI_HEALTH_URL: "https://example.com/health",
        });
        const fetchMock = jest.fn().mockRejectedValue(new Error("network"));
        mockFetch(fetchMock);

        await expect(module.fetchHealth()).resolves.toBe("degraded");
    });
});
