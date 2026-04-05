import { getOpenAIConfig } from "@/config/openAI";

export const OPENAI_MINI_MODEL = "gpt-4o-mini";

export function getOpenAIProxyUrl(): string {
    const { featureEnabled, proxyUrl } = getOpenAIConfig();

    if (!featureEnabled || !proxyUrl) {
        throw new Error("AI 기능이 비활성화되어 있어요. 백엔드 프록시 URL을 설정해주세요.");
    }

    return proxyUrl;
}

/**
 * Note: Direct OpenAI access from the client is intentionally disabled to avoid
 * leaking API keys. Point AI calls to a backend proxy configured in app config.
 */
