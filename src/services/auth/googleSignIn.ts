import { Buffer } from "buffer";

import type { OAuthProfilePayload } from "@/services/database";

type GoogleAuthTokens = {
    idToken?: string | null;
    accessToken?: string | null;
};

type GoogleIdentity = {
    subject: string;
    email: string;
    displayName: string | null;
};

type GoogleTokenInfoResponse = {
    sub?: unknown;
    email?: unknown;
    email_verified?: unknown;
    name?: unknown;
    aud?: unknown;
};

type GoogleUserInfoResponse = {
    sub?: unknown;
    email?: unknown;
    email_verified?: unknown;
    name?: unknown;
};

type ResolveGoogleOAuthProfileOptions = {
    allowedAudiences?: string[];
    fetcher?: typeof fetch;
};

function normalizeString(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed || null;
}

function normalizeBoolean(value: unknown): boolean | null {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
            return true;
        }
        if (normalized === "false") {
            return false;
        }
    }
    return null;
}

function normalizeAllowedAudiences(values: string[] | undefined): string[] {
    if (!Array.isArray(values)) {
        return [];
    }
    return values
        .map((value) => value.trim())
        .filter(Boolean)
        .sort();
}

function hasAllowedAudience(aud: unknown, allowedAudiences: string[]): boolean {
    if (allowedAudiences.length === 0) {
        return true;
    }

    if (typeof aud === "string") {
        return allowedAudiences.includes(aud.trim());
    }

    if (Array.isArray(aud)) {
        const candidates = aud
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim());
        return candidates.some((value) => allowedAudiences.includes(value));
    }

    return false;
}

function decodeBase64Url(payload: string): string | null {
    try {
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        return Buffer.from(padded, "base64").toString("utf8");
    } catch {
        return null;
    }
}

function decodeIdToken(idToken: string): Record<string, unknown> | null {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
        return null;
    }

    const decoded = decodeBase64Url(parts[1]);
    if (!decoded) {
        return null;
    }

    try {
        const payload = JSON.parse(decoded) as unknown;
        if (!payload || typeof payload !== "object") {
            return null;
        }
        return payload as Record<string, unknown>;
    } catch {
        return null;
    }
}

function toOAuthProfile(identity: GoogleIdentity): OAuthProfilePayload {
    return {
        provider: "google",
        subject: identity.subject,
        email: identity.email,
        displayName: identity.displayName,
    };
}

function extractIdentity(payload: {
    sub?: unknown;
    email?: unknown;
    email_verified?: unknown;
    name?: unknown;
}): GoogleIdentity | null {
    const subject = normalizeString(payload.sub);
    const email = normalizeString(payload.email)?.toLowerCase() ?? null;
    const emailVerified = normalizeBoolean(payload.email_verified);

    if (!subject || !email || emailVerified !== true) {
        return null;
    }

    return {
        subject,
        email,
        displayName: normalizeString(payload.name),
    };
}

async function fetchJson(
    fetcher: typeof fetch,
    url: string,
    init?: Parameters<typeof fetch>[1],
): Promise<Record<string, unknown> | null> {
    const response = await fetcher(url, init);
    if (!response.ok) {
        return null;
    }
    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== "object") {
        return null;
    }
    return payload as Record<string, unknown>;
}

async function resolveByTokenInfo(
    fetcher: typeof fetch,
    idToken: string,
    allowedAudiences: string[],
): Promise<GoogleIdentity | null> {
    const payload = (await fetchJson(
        fetcher,
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        { method: "GET" },
    )) as GoogleTokenInfoResponse | null;

    if (!payload || !hasAllowedAudience(payload.aud, allowedAudiences)) {
        return null;
    }

    return extractIdentity(payload);
}

async function resolveByUserInfo(fetcher: typeof fetch, accessToken: string): Promise<GoogleIdentity | null> {
    const payload = (await fetchJson(fetcher, "https://www.googleapis.com/oauth2/v3/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })) as GoogleUserInfoResponse | null;

    if (!payload) {
        return null;
    }

    return extractIdentity(payload);
}

function resolveByDecodedToken(idToken: string, allowedAudiences: string[]): GoogleIdentity | null {
    const payload = decodeIdToken(idToken);
    if (!payload || !hasAllowedAudience(payload.aud, allowedAudiences)) {
        return null;
    }

    return extractIdentity(payload);
}

export async function resolveGoogleOAuthProfile(
    tokens: GoogleAuthTokens,
    options: ResolveGoogleOAuthProfileOptions = {},
): Promise<OAuthProfilePayload> {
    const idToken = normalizeString(tokens.idToken);
    const accessToken = normalizeString(tokens.accessToken);
    const allowedAudiences = normalizeAllowedAudiences(options.allowedAudiences);

    if (!idToken && !accessToken) {
        throw new Error("Google 인증 토큰을 확인하지 못했어요. 다시 시도해주세요.");
    }

    const fetcher = options.fetcher ?? (typeof fetch === "function" ? fetch.bind(globalThis) : null);

    if (idToken && fetcher) {
        try {
            const identity = await resolveByTokenInfo(fetcher, idToken, allowedAudiences);
            if (identity) {
                return toOAuthProfile(identity);
            }
        } catch {
            // Fallback to userinfo or decoded token.
        }
    }

    if (accessToken && fetcher) {
        try {
            const identity = await resolveByUserInfo(fetcher, accessToken);
            if (identity) {
                return toOAuthProfile(identity);
            }
        } catch {
            // Fallback to decoded token when tokeninfo/userinfo is unreachable.
        }
    }

    if (idToken) {
        const decodedIdentity = resolveByDecodedToken(idToken, allowedAudiences);
        if (decodedIdentity) {
            return toOAuthProfile(decodedIdentity);
        }
    }

    throw new Error("Google 계정 정보를 검증하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.");
}
