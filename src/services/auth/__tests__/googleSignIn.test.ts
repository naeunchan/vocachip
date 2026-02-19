import { Buffer } from "buffer";

import { resolveGoogleOAuthProfile } from "@/services/auth/googleSignIn";

function createResponse(ok: boolean, payload: unknown): Response {
    return {
        ok,
        json: async () => payload,
    } as unknown as Response;
}

function toBase64Url(value: string): string {
    return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createIdToken(payload: Record<string, unknown>): string {
    const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const body = toBase64Url(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

describe("resolveGoogleOAuthProfile", () => {
    it("resolves identity from Google tokeninfo", async () => {
        const fetcher = jest.fn(async (url: string) => {
            if (url.includes("tokeninfo")) {
                return createResponse(true, {
                    sub: "google-sub-1",
                    email: "user@example.com",
                    email_verified: "true",
                    name: "User One",
                    aud: "client-1",
                });
            }
            throw new Error("unexpected url");
        }) as unknown as typeof fetch;

        const profile = await resolveGoogleOAuthProfile(
            { idToken: "valid-id-token" },
            { allowedAudiences: ["client-1"], fetcher },
        );

        expect(profile).toEqual({
            provider: "google",
            subject: "google-sub-1",
            email: "user@example.com",
            displayName: "User One",
        });
    });

    it("falls back to userinfo when id token is unavailable", async () => {
        const fetcher = jest.fn(async (url: string) => {
            if (url.includes("userinfo")) {
                return createResponse(true, {
                    sub: "google-sub-2",
                    email: "user2@example.com",
                    email_verified: true,
                    name: "User Two",
                });
            }
            throw new Error("unexpected url");
        }) as unknown as typeof fetch;

        const profile = await resolveGoogleOAuthProfile({ accessToken: "access-token" }, { fetcher });

        expect(profile).toEqual({
            provider: "google",
            subject: "google-sub-2",
            email: "user2@example.com",
            displayName: "User Two",
        });
    });

    it("falls back to decoding id token when network lookup fails", async () => {
        const idToken = createIdToken({
            sub: "google-sub-3",
            email: "decoded@example.com",
            email_verified: true,
            name: "Decoded User",
            aud: "client-2",
        });

        const fetcher = jest.fn(async () => {
            throw new Error("network down");
        }) as unknown as typeof fetch;

        const profile = await resolveGoogleOAuthProfile({ idToken }, { allowedAudiences: ["client-2"], fetcher });

        expect(profile).toEqual({
            provider: "google",
            subject: "google-sub-3",
            email: "decoded@example.com",
            displayName: "Decoded User",
        });
    });

    it("throws when audience does not match", async () => {
        const idToken = createIdToken({
            sub: "google-sub-4",
            email: "mismatch@example.com",
            email_verified: true,
            aud: "other-client",
        });

        const fetcher = jest.fn(async () => createResponse(false, {})) as unknown as typeof fetch;

        await expect(
            resolveGoogleOAuthProfile({ idToken }, { allowedAudiences: ["client-expected"], fetcher }),
        ).rejects.toThrow("Google 계정 정보를 검증하지 못했어요.");
    });
});
