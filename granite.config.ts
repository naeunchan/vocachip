import { appsInToss } from "@apps-in-toss/framework/plugins";
import { env } from "@granite-js/plugin-env";
import { defineConfig } from "@granite-js/react-native/config";

const path = require("path");
const { loadProjectEnv } = require(path.resolve(process.cwd(), "scripts/release/load-project-env.js"));
const packageJson = require(path.resolve(process.cwd(), "package.json"));

const DEFAULT_APP_VERSION = "1.0.0";
const DEFAULT_DISPLAY_NAME = "Vocachip";
const DEFAULT_PRIMARY_COLOR = "#1d4ed8";
const DEFAULT_PRIVACY_POLICY_URL = "https://vocachip.app/legal/privacy";
const DEFAULT_TERMS_OF_SERVICE_URL = "https://vocachip.app/legal/terms";

loadProjectEnv({ rootDir: process.cwd() });

function parseBoolean(value?: string | null) {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "on", "yes"].includes(normalized)) return true;
    if (["0", "false", "off", "no"].includes(normalized)) return false;
    return null;
}

function toEnvBoolean(value: boolean) {
    return value ? "true" : "false";
}

function resolveString(value: unknown, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function resolveProfile() {
    const profile = resolveString(process.env.APP_ENV).toLowerCase();
    if (profile) return profile;
    return process.env.NODE_ENV === "production" ? "production" : "development";
}

const profile = resolveProfile();
const isProduction = profile === "production";
const profileDefaults = {
    featureAccountAuth: !isProduction,
    featureGuestAccountCta: !isProduction,
    featureBackupRestore: false,
    featureReviewLoop: false,
    featureReviewHomeDashboard: false,
    featureReviewSessionUi: false,
    featureDailyGoal: false,
    featureReviewReminder: false,
    featureCollections: false,
    featureFavoritesBatchActions: false,
    featureAiStudyMode: false,
    featureAiStudyEntryPoints: false,
    featureAiStudySessionUi: false,
};

function resolveFlag(name: keyof typeof profileDefaults, envName: string) {
    const envValue = parseBoolean(process.env[envName]);
    if (envValue !== null) {
        return envValue;
    }
    return profileDefaults[name];
}

const appVersion = resolveString(packageJson.version, DEFAULT_APP_VERSION);
const versionLabel = resolveString(process.env.VOCACHIP_VERSION_LABEL, appVersion);
const primaryColor = resolveString(process.env.AIT_PRIMARY_COLOR, DEFAULT_PRIMARY_COLOR);

export default defineConfig({
    scheme: "intoss",
    appName: resolveString(process.env.AIT_APP_NAME, resolveString(packageJson.name, "vocachip")),
    entryFile: "./src/_app.tsx",
    outdir: "dist",
    cwd: process.cwd(),
    build: {
        resolver: {
            alias: [{ from: "@", to: path.resolve(process.cwd(), "src"), exact: false }],
        },
    },
    plugins: [
        appsInToss({
            brand: {
                displayName: resolveString(process.env.AIT_DISPLAY_NAME, DEFAULT_DISPLAY_NAME),
                primaryColor,
                icon: resolveString(process.env.AIT_APP_ICON_URL, ""),
            },
            permissions: [
                {
                    name: "clipboard",
                    access: "read",
                },
                {
                    name: "clipboard",
                    access: "write",
                },
            ],
        }),
        env({
            VOCACHIP_APP_VERSION: appVersion,
            VOCACHIP_VERSION_LABEL: versionLabel,
            VOCACHIP_PRIVACY_POLICY_URL: resolveString(
                process.env.VOCACHIP_PRIVACY_POLICY_URL,
                DEFAULT_PRIVACY_POLICY_URL,
            ),
            VOCACHIP_TERMS_OF_SERVICE_URL: resolveString(
                process.env.VOCACHIP_TERMS_OF_SERVICE_URL,
                DEFAULT_TERMS_OF_SERVICE_URL,
            ),
            VOCACHIP_SENTRY_DSN: resolveString(process.env.VOCACHIP_SENTRY_DSN),
            VOCACHIP_OPENAI_PROXY_URL: resolveString(process.env.VOCACHIP_OPENAI_PROXY_URL),
            VOCACHIP_OPENAI_PROXY_KEY: resolveString(process.env.VOCACHIP_OPENAI_PROXY_KEY),
            VOCACHIP_AI_HEALTH_URL: resolveString(process.env.VOCACHIP_AI_HEALTH_URL),
            VOCACHIP_DICTIONARY_PROXY_URL: resolveString(process.env.VOCACHIP_DICTIONARY_PROXY_URL),
            VOCACHIP_FEATURE_ACCOUNT_AUTH: toEnvBoolean(
                resolveFlag("featureAccountAuth", "VOCACHIP_FEATURE_ACCOUNT_AUTH"),
            ),
            VOCACHIP_FEATURE_GUEST_ACCOUNT_CTA: toEnvBoolean(
                resolveFlag("featureGuestAccountCta", "VOCACHIP_FEATURE_GUEST_ACCOUNT_CTA"),
            ),
            VOCACHIP_FEATURE_BACKUP_RESTORE: toEnvBoolean(
                resolveFlag("featureBackupRestore", "VOCACHIP_FEATURE_BACKUP_RESTORE"),
            ),
            VOCACHIP_FEATURE_REVIEW_LOOP: toEnvBoolean(
                resolveFlag("featureReviewLoop", "VOCACHIP_FEATURE_REVIEW_LOOP"),
            ),
            VOCACHIP_FEATURE_REVIEW_HOME_DASHBOARD: toEnvBoolean(
                resolveFlag("featureReviewHomeDashboard", "VOCACHIP_FEATURE_REVIEW_HOME_DASHBOARD"),
            ),
            VOCACHIP_FEATURE_REVIEW_SESSION_UI: toEnvBoolean(
                resolveFlag("featureReviewSessionUi", "VOCACHIP_FEATURE_REVIEW_SESSION_UI"),
            ),
            VOCACHIP_FEATURE_DAILY_GOAL: toEnvBoolean(resolveFlag("featureDailyGoal", "VOCACHIP_FEATURE_DAILY_GOAL")),
            VOCACHIP_FEATURE_REVIEW_REMINDER: toEnvBoolean(
                resolveFlag("featureReviewReminder", "VOCACHIP_FEATURE_REVIEW_REMINDER"),
            ),
            VOCACHIP_FEATURE_COLLECTIONS: toEnvBoolean(
                resolveFlag("featureCollections", "VOCACHIP_FEATURE_COLLECTIONS"),
            ),
            VOCACHIP_FEATURE_FAVORITES_BATCH_ACTIONS: toEnvBoolean(
                resolveFlag("featureFavoritesBatchActions", "VOCACHIP_FEATURE_FAVORITES_BATCH_ACTIONS"),
            ),
            VOCACHIP_FEATURE_AI_STUDY_MODE: toEnvBoolean(
                resolveFlag("featureAiStudyMode", "VOCACHIP_FEATURE_AI_STUDY_MODE"),
            ),
            VOCACHIP_FEATURE_AI_STUDY_ENTRY_POINTS: toEnvBoolean(
                resolveFlag("featureAiStudyEntryPoints", "VOCACHIP_FEATURE_AI_STUDY_ENTRY_POINTS"),
            ),
            VOCACHIP_FEATURE_AI_STUDY_SESSION_UI: toEnvBoolean(
                resolveFlag("featureAiStudySessionUi", "VOCACHIP_FEATURE_AI_STUDY_SESSION_UI"),
            ),
        }),
    ],
});
