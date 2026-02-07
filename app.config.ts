import type { ExpoConfig } from "@expo/config-types";

const staticConfig = require("./app.json") as { expo: ExpoConfig };

function parseBoolean(value: string | undefined): boolean | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "on", "yes"].includes(normalized)) return true;
    if (["0", "false", "off", "no"].includes(normalized)) return false;
    return null;
}

function resolveProfile() {
    const profile = (process.env.EAS_BUILD_PROFILE ?? process.env.APP_ENV ?? "").trim().toLowerCase();
    if (profile) return profile;
    return process.env.NODE_ENV === "production" ? "production" : "development";
}

export default (): ExpoConfig => {
    const profile = resolveProfile();
    const isProduction = profile === "production";
    const profileDefaults = {
        featureGuestAccountCta: !isProduction,
        featureBackupRestore: false,
        featureBiometricAutoLogin: false,
    };

    const guestCtaFromEnv = parseBoolean(process.env.EXPO_PUBLIC_FEATURE_GUEST_ACCOUNT_CTA);
    const backupRestoreFromEnv = parseBoolean(process.env.EXPO_PUBLIC_FEATURE_BACKUP_RESTORE);
    const biometricAutoLoginFromEnv = parseBoolean(process.env.EXPO_PUBLIC_FEATURE_BIOMETRIC_AUTO_LOGIN);

    const expoConfig: ExpoConfig = {
        ...staticConfig.expo,
        extra: {
            ...(staticConfig.expo.extra ?? {}),
            featureProfile: profile,
            featureGuestAccountCta: guestCtaFromEnv ?? profileDefaults.featureGuestAccountCta,
            featureBackupRestore: backupRestoreFromEnv ?? profileDefaults.featureBackupRestore,
            featureBiometricAutoLogin: biometricAutoLoginFromEnv ?? profileDefaults.featureBiometricAutoLogin,
        },
    };

    return expoConfig;
};
