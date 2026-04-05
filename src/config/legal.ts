import { getRuntimeConfig } from "@/config/runtime";

const BLOCKED_HOSTS = new Set(["192.168.0.31", "127.0.0.1", "0.0.0.0", "example.com"]);

function isPrivateIp(hostname: string) {
    const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return false;
    const [a, b] = [Number(match[1]), Number(match[2])];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function sanitizeLegalUrl(input: unknown): string {
    if (typeof input !== "string") return "";
    const trimmed = input.trim();
    if (!trimmed) return "";
    try {
        const url = new URL(trimmed);
        if (url.protocol !== "https:") return "";
        const host = url.hostname.toLowerCase();
        if (BLOCKED_HOSTS.has(host) || isPrivateIp(host)) return "";
        return url.toString();
    } catch {
        return "";
    }
}

export function getPrivacyPolicyUrl(): string {
    return sanitizeLegalUrl(getRuntimeConfig().privacyPolicyUrl);
}

export function getTermsOfServiceUrl(): string {
    return sanitizeLegalUrl(getRuntimeConfig().termsOfServiceUrl);
}
