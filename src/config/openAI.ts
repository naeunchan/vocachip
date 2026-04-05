import { getRuntimeConfig } from "@/config/runtime";

export type OpenAIConfig = {
    proxyUrl: string;
    proxyKey: string;
    healthUrl: string;
    featureEnabled: boolean;
};

function normalizeUrl(value: string): string {
    return value.trim().replace(/\/+$/, "");
}

function readEnv(name: string): string {
    const value = globalThis.process?.env?.[name];
    return typeof value === "string" ? value.trim() : "";
}

export function getOpenAIConfig(): OpenAIConfig {
    const runtime = getRuntimeConfig();
    const proxyFromRuntime = typeof runtime.openAIProxyUrl === "string" ? normalizeUrl(runtime.openAIProxyUrl) : "";
    const proxyFromEnv = readEnv("VOCACHIP_OPENAI_PROXY_URL");
    const proxyKeyFromRuntime = typeof runtime.openAIProxyKey === "string" ? runtime.openAIProxyKey.trim() : "";
    const proxyKeyFromEnv = readEnv("VOCACHIP_OPENAI_PROXY_KEY");
    const healthFromRuntime = typeof runtime.aiHealthUrl === "string" ? normalizeUrl(runtime.aiHealthUrl) : "";
    const healthFromEnv = readEnv("VOCACHIP_AI_HEALTH_URL");

    const proxyUrl = proxyFromEnv ? normalizeUrl(proxyFromEnv) : proxyFromRuntime;
    const proxyKey = proxyKeyFromEnv || proxyKeyFromRuntime;
    const healthUrl =
        (healthFromEnv ? normalizeUrl(healthFromEnv) : "") ||
        healthFromRuntime ||
        (proxyUrl ? `${proxyUrl}/health` : "");

    return {
        proxyUrl,
        proxyKey,
        healthUrl,
        featureEnabled: Boolean(proxyUrl && proxyKey),
    };
}

export function isOpenAIFeatureEnabled(): boolean {
    return getOpenAIConfig().featureEnabled;
}
