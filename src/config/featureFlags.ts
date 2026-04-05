import { getRuntimeConfig } from "@/config/runtime";

type AppExtra = {
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

type FeatureFlags = {
    accountAuth: boolean;
    guestAccountCta: boolean;
    backupRestore: boolean;
    reviewLoop: boolean;
    reviewHomeDashboard: boolean;
    reviewSessionUi: boolean;
    dailyGoal: boolean;
    reviewReminder: boolean;
    collections: boolean;
    favoritesBatchActions: boolean;
    aiStudyMode: boolean;
    aiStudyEntryPoints: boolean;
    aiStudySessionUi: boolean;
};

function parseBooleanFlag(value: unknown): boolean | null {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1" || normalized === "on") {
            return true;
        }
        if (normalized === "false" || normalized === "0" || normalized === "off") {
            return false;
        }
    }
    return null;
}

function resolveFlag(envValue: string | undefined, extraValue: unknown, fallback: boolean): boolean {
    const parsedEnv = parseBooleanFlag(envValue);
    if (parsedEnv !== null) {
        return parsedEnv;
    }

    const parsedExtra = parseBooleanFlag(extraValue);
    if (parsedExtra !== null) {
        return parsedExtra;
    }

    return fallback;
}

function readEnvFlag(name: string): string | undefined {
    const value = globalThis.process?.env?.[name];
    return typeof value === "string" ? value : undefined;
}

export function getFeatureFlags(): FeatureFlags {
    const runtime = getRuntimeConfig() as AppExtra;

    return {
        // Defaults to enabled outside production unless runtime config explicitly turns it off.
        accountAuth: resolveFlag(readEnvFlag("VOCACHIP_FEATURE_ACCOUNT_AUTH"), runtime.featureAccountAuth, true),
        // Hidden by default since login/signup path is disabled in current release.
        guestAccountCta: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_GUEST_ACCOUNT_CTA"),
            runtime.featureGuestAccountCta,
            false,
        ),
        // Hidden by default until UX/security policy is finalized.
        backupRestore: resolveFlag(readEnvFlag("VOCACHIP_FEATURE_BACKUP_RESTORE"), runtime.featureBackupRestore, false),
        // Hidden by default until the review loop is validated end-to-end.
        reviewLoop: resolveFlag(readEnvFlag("VOCACHIP_FEATURE_REVIEW_LOOP"), runtime.featureReviewLoop, false),
        // Hidden by default until the review dashboard contract is ready.
        reviewHomeDashboard: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_REVIEW_HOME_DASHBOARD"),
            runtime.featureReviewHomeDashboard,
            false,
        ),
        // Hidden by default until the dedicated review session UI is ready.
        reviewSessionUi: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_REVIEW_SESSION_UI"),
            runtime.featureReviewSessionUi,
            false,
        ),
        // Hidden by default until goal tracking is wired into review progress.
        dailyGoal: resolveFlag(readEnvFlag("VOCACHIP_FEATURE_DAILY_GOAL"), runtime.featureDailyGoal, false),
        // Hidden by default until reminder UX and scheduling policy are finalized.
        reviewReminder: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_REVIEW_REMINDER"),
            runtime.featureReviewReminder,
            false,
        ),
        // Hidden by default until collection CRUD and filtering are wired into Search/Favorites.
        collections: resolveFlag(readEnvFlag("VOCACHIP_FEATURE_COLLECTIONS"), runtime.featureCollections, false),
        // Hidden by default until Favorites multi-select and batch actions are ready.
        favoritesBatchActions: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_FAVORITES_BATCH_ACTIONS"),
            runtime.featureFavoritesBatchActions,
            false,
        ),
        // Hidden by default until AI study generation is stable behind the proxy.
        aiStudyMode: resolveFlag(readEnvFlag("VOCACHIP_FEATURE_AI_STUDY_MODE"), runtime.featureAiStudyMode, false),
        // Hidden by default until Search/Favorites entry points are wired to the study flow.
        aiStudyEntryPoints: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_AI_STUDY_ENTRY_POINTS"),
            runtime.featureAiStudyEntryPoints,
            false,
        ),
        // Hidden by default until the dedicated study session UI is implemented.
        aiStudySessionUi: resolveFlag(
            readEnvFlag("VOCACHIP_FEATURE_AI_STUDY_SESSION_UI"),
            runtime.featureAiStudySessionUi,
            false,
        ),
    };
}

const featureFlagOverrides: Partial<FeatureFlags> = {};

export const FEATURE_FLAGS = new Proxy({} as FeatureFlags, {
    get(_target, property: keyof FeatureFlags) {
        if (property in featureFlagOverrides) {
            return featureFlagOverrides[property];
        }
        return getFeatureFlags()[property];
    },
    set(_target, property: keyof FeatureFlags, value: FeatureFlags[keyof FeatureFlags]) {
        featureFlagOverrides[property] = value;
        return true;
    },
    deleteProperty(_target, property: keyof FeatureFlags) {
        delete featureFlagOverrides[property];
        return true;
    },
    ownKeys() {
        return Reflect.ownKeys({
            ...getFeatureFlags(),
            ...featureFlagOverrides,
        });
    },
    getOwnPropertyDescriptor() {
        return {
            configurable: true,
            enumerable: true,
        };
    },
});
