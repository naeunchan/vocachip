import { setRuntimeConfig } from "../config/runtime";

type GraniteRuntimeScope = typeof globalThis & {
    __granite?: {
        meta?: {
            env?: Record<string, unknown>;
        };
    };
};

const runtimeEnv: Record<string, unknown> = (globalThis as GraniteRuntimeScope).__granite?.meta?.env ?? {};

function readString(name: string, fallback = ""): string {
    const value = runtimeEnv[name];
    return typeof value === "string" ? value : fallback;
}

setRuntimeConfig({
    runtimeTarget: "apps-in-toss",
    appVersion: readString("VOCACHIP_APP_VERSION", "1.0.0"),
    versionLabel: readString("VOCACHIP_VERSION_LABEL", "1.0.0"),
    privacyPolicyUrl: readString("VOCACHIP_PRIVACY_POLICY_URL"),
    termsOfServiceUrl: readString("VOCACHIP_TERMS_OF_SERVICE_URL"),
    openAIProxyUrl: readString("VOCACHIP_OPENAI_PROXY_URL"),
    openAIProxyKey: readString("VOCACHIP_OPENAI_PROXY_KEY"),
    aiHealthUrl: readString("VOCACHIP_AI_HEALTH_URL"),
    sentryDsn: readString("VOCACHIP_SENTRY_DSN"),
    featureAccountAuth: runtimeEnv.VOCACHIP_FEATURE_ACCOUNT_AUTH,
    featureGuestAccountCta: runtimeEnv.VOCACHIP_FEATURE_GUEST_ACCOUNT_CTA,
    featureBackupRestore: runtimeEnv.VOCACHIP_FEATURE_BACKUP_RESTORE,
    featureReviewLoop: runtimeEnv.VOCACHIP_FEATURE_REVIEW_LOOP,
    featureReviewHomeDashboard: runtimeEnv.VOCACHIP_FEATURE_REVIEW_HOME_DASHBOARD,
    featureReviewSessionUi: runtimeEnv.VOCACHIP_FEATURE_REVIEW_SESSION_UI,
    featureDailyGoal: runtimeEnv.VOCACHIP_FEATURE_DAILY_GOAL,
    featureReviewReminder: runtimeEnv.VOCACHIP_FEATURE_REVIEW_REMINDER,
    featureCollections: runtimeEnv.VOCACHIP_FEATURE_COLLECTIONS,
    featureFavoritesBatchActions: runtimeEnv.VOCACHIP_FEATURE_FAVORITES_BATCH_ACTIONS,
    featureAiStudyMode: runtimeEnv.VOCACHIP_FEATURE_AI_STUDY_MODE,
    featureAiStudyEntryPoints: runtimeEnv.VOCACHIP_FEATURE_AI_STUDY_ENTRY_POINTS,
    featureAiStudySessionUi: runtimeEnv.VOCACHIP_FEATURE_AI_STUDY_SESSION_UI,
});
