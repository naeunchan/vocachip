describe("runtime config", () => {
    beforeEach(() => {
        jest.resetModules();
        const runtimeScope = globalThis as typeof globalThis & { __VOCACHIP_RUNTIME_CONFIG__?: unknown };
        delete runtimeScope.__VOCACHIP_RUNTIME_CONFIG__;
    });

    it("does not load expo-constants in apps-in-toss runtime", () => {
        const expoConstantsFactory = jest.fn(() => {
            throw new Error("expo-constants should not be loaded");
        });

        jest.doMock("expo-constants", expoConstantsFactory, { virtual: true });

        const runtime = require("@/config/runtime") as typeof import("@/config/runtime");
        runtime.setRuntimeConfig({
            runtimeTarget: "apps-in-toss",
            versionLabel: "test-version",
        });

        expect(runtime.getRuntimeConfig()).toEqual(
            expect.objectContaining({
                runtimeTarget: "apps-in-toss",
                versionLabel: "test-version",
            }),
        );
        expect(expoConstantsFactory).not.toHaveBeenCalled();
    });
});
