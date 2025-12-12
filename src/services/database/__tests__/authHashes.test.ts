import { Buffer } from "buffer";

import { hashPassword, verifyPasswordHash } from "../index";

jest.mock("expo-crypto", () => ({
    CryptoDigestAlgorithm: { SHA256: "SHA256" },
    digestStringAsync: jest.fn(async (_algorithm: string, input: string) => `digest:${input}`),
    getRandomBytesAsync: jest.fn(async (length: number) => {
        const source = Buffer.from("deterministic-salt");
        return source.subarray(0, length);
    }),
}));

describe("password hashing helpers", () => {
    it("hashes with provided salt and verifies correctly", async () => {
        const salt = "mysalt";
        const hash = await hashPassword("P@ssw0rd", salt);

        expect(hash).toBe(`sha256.v1:${salt}:digest:${salt}:P@ssw0rd`);
        await expect(verifyPasswordHash("P@ssw0rd", hash)).resolves.toBe(true);
        await expect(verifyPasswordHash("wrong", hash)).resolves.toBe(false);
    });

    it("generates a salt when not provided", async () => {
        const hash = await hashPassword("autogen");
        expect(hash.startsWith("sha256.v1:")).toBe(true);
        const [, salt] = hash.split(":");
        expect(salt?.length).toBeGreaterThan(0);
        await expect(verifyPasswordHash("autogen", hash)).resolves.toBe(true);
    });
});
