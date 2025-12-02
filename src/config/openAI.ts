import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

const proxyFromExtra = typeof extra.openAIProxyUrl === "string" ? extra.openAIProxyUrl.trim() : "";
const proxyFromEnv = (process.env.EXPO_PUBLIC_OPENAI_PROXY_URL ?? "").trim();

/**
 * Backend proxy URL used for AI-powered features (examples/TTS).
 * TODO: Replace the placeholder with your deployed backend endpoint before release.
 */
export const OPENAI_PROXY_URL = proxyFromExtra || proxyFromEnv;

/**
 * Gatekeeper flag so AI features stay off by default in production builds
 * unless a secure backend proxy is configured.
 */
export const OPENAI_FEATURE_ENABLED = Boolean(OPENAI_PROXY_URL);

const healthFromEnv = (process.env.EXPO_PUBLIC_AI_HEALTH_URL ?? "").trim();
/**
 * Optional health check URL for AI proxy.
 * Defaults to `<OPENAI_PROXY_URL>/health` when configured.
 */
export const AI_HEALTH_URL =
	healthFromEnv || (OPENAI_PROXY_URL ? `${OPENAI_PROXY_URL.replace(/\/+$/, "")}/health` : "");
