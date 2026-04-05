type RuntimeTarget = "apps-in-toss";

type RuntimeConfig = {
    runtimeTarget: RuntimeTarget;
    appVersion: string;
    versionLabel: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    openAIProxyUrl: string;
    openAIProxyKey: string;
    aiHealthUrl: string;
    sentryDsn: string;
    featureAccountAuth?: unknown;
    featureGuestAccountCta?: unknown;
    featureBackupRestore?: unknown;
    featureReviewLoop?: unknown;
    featureReviewHomeDashboard?: unknown;
    featureReviewSessionUi?: unknown;
    featureDailyGoal?: unknown;
    featureReviewReminder?: unknown;
    featureCollections?: unknown;
    featureFavoritesBatchActions?: unknown;
    featureAiStudyMode?: unknown;
    featureAiStudyEntryPoints?: unknown;
    featureAiStudySessionUi?: unknown;
};

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
    runtimeTarget: "apps-in-toss",
    appVersion: "1.0.0",
    versionLabel: "1.0.0",
    privacyPolicyUrl: "https://vocachip.app/legal/privacy",
    termsOfServiceUrl: "https://vocachip.app/legal/terms",
    openAIProxyUrl: "",
    openAIProxyKey: "",
    aiHealthUrl: "",
    sentryDsn: "",
};

type RuntimeScope = typeof globalThis & {
    __VOCACHIP_RUNTIME_CONFIG__?: Partial<RuntimeConfig>;
};

function getRuntimeScope(): RuntimeScope {
    return globalThis as RuntimeScope;
}

function readString(value: unknown, fallback: string): string {
    return typeof value === "string" ? value : fallback;
}

function readEnvString(name: string): string {
    const value = globalThis.process?.env?.[name];
    return typeof value === "string" ? value.trim() : "";
}

export function setRuntimeConfig(overrides: Partial<RuntimeConfig>) {
    const scope = getRuntimeScope();
    scope.__VOCACHIP_RUNTIME_CONFIG__ = {
        ...(scope.__VOCACHIP_RUNTIME_CONFIG__ ?? {}),
        ...overrides,
    };
}

function resolveRuntimeTarget(value: unknown): RuntimeTarget {
    if (value === "apps-in-toss") {
        return value;
    }
    return DEFAULT_RUNTIME_CONFIG.runtimeTarget;
}

export function getRuntimeConfig(): RuntimeConfig {
    const runtime = getRuntimeScope().__VOCACHIP_RUNTIME_CONFIG__ ?? {};

    return {
        ...DEFAULT_RUNTIME_CONFIG,
        ...runtime,
        runtimeTarget: resolveRuntimeTarget(runtime.runtimeTarget),
        appVersion: readString(
            runtime.appVersion,
            readEnvString("VOCACHIP_APP_VERSION") || DEFAULT_RUNTIME_CONFIG.appVersion,
        ),
        versionLabel: readString(
            runtime.versionLabel,
            readEnvString("VOCACHIP_VERSION_LABEL") || DEFAULT_RUNTIME_CONFIG.versionLabel,
        ),
        privacyPolicyUrl: readString(
            runtime.privacyPolicyUrl,
            readEnvString("VOCACHIP_PRIVACY_POLICY_URL") || DEFAULT_RUNTIME_CONFIG.privacyPolicyUrl,
        ),
        termsOfServiceUrl: readString(
            runtime.termsOfServiceUrl,
            readEnvString("VOCACHIP_TERMS_OF_SERVICE_URL") || DEFAULT_RUNTIME_CONFIG.termsOfServiceUrl,
        ),
        openAIProxyUrl: readString(
            runtime.openAIProxyUrl,
            readEnvString("VOCACHIP_OPENAI_PROXY_URL") || DEFAULT_RUNTIME_CONFIG.openAIProxyUrl,
        ),
        openAIProxyKey: readString(
            runtime.openAIProxyKey,
            readEnvString("VOCACHIP_OPENAI_PROXY_KEY") || DEFAULT_RUNTIME_CONFIG.openAIProxyKey,
        ),
        aiHealthUrl: readString(
            runtime.aiHealthUrl,
            readEnvString("VOCACHIP_AI_HEALTH_URL") || DEFAULT_RUNTIME_CONFIG.aiHealthUrl,
        ),
        sentryDsn: readString(
            runtime.sentryDsn,
            readEnvString("VOCACHIP_SENTRY_DSN") || DEFAULT_RUNTIME_CONFIG.sentryDsn,
        ),
    };
}
